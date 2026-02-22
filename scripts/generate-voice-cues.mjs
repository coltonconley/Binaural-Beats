/**
 * Generates neural TTS voice cue MP3 files for all guided meditation presets.
 *
 * v2: Split-sentence synthesis — each sentence is a separate TTS call with wide
 * prosody variation, concatenated with real silence gaps via ffmpeg, and post-
 * processed with warmth filters (lowpass + subtle early reflection).
 *
 * Uses Microsoft's Edge TTS websocket directly (bypassing node-edge-tts's
 * hardcoded SSML template) for full control over voice, prosody, and output format.
 * Generates one MP3 per spoken voice cue (skipping chimeOnly cues).
 * Output: public/voice/{trackId}/{000}.mp3 + public/voice/manifest.json
 *
 * Run: npm run generate:voice
 * Requires: npm install --save-dev node-edge-tts tsx ws
 * Requires: ffmpeg installed and on PATH
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash, randomBytes } from 'crypto'
import { spawn } from 'child_process'
import WebSocket from 'ws'

// Re-use DRM token logic from node-edge-tts (CJS module, use createRequire)
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { TRUSTED_CLIENT_TOKEN, CHROMIUM_FULL_VERSION, generateSecMsGecToken } = require('node-edge-tts/dist/drm')

// tsx allows importing TypeScript source directly
import { guidedPresets } from '../src/guidedPresets.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '..', 'public')
const VOICE_DIR = resolve(PUBLIC_DIR, 'voice')

// TTS settings — warmer, calmer voice for guided meditation
const VOICE = 'en-US-JennyNeural'
const OUTPUT_FORMAT = 'audio-24khz-96kbitrate-mono-mp3'

// Bump SSML_VERSION whenever synthesis pipeline changes — forces full regeneration
const SSML_VERSION = 2

// PCM format constants (must match ffmpeg decode/encode args)
const PCM_SAMPLE_RATE = 24000
const PCM_BYTES_PER_SAMPLE = 2 // s16le

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '"': return '&quot;'
      case "'": return '&apos;'
      default: return c
    }
  })
}

// ── Text classification ─────────────────────────────────────────────────────

/**
 * Classify text into a pacing category.
 *   single-word:     ≤15 chars  (e.g. "One.", "Deeper.")
 *   short-phrase:    ≤50 chars, 1 sentence
 *   single-sentence: 1 sentence, >50 chars
 *   multi-sentence:  2-3 sentences
 *   paragraph:       4+ sentences
 */
function classifyText(text) {
  const sentences = splitSentences(text)
  if (sentences.length >= 4) return 'paragraph'
  if (sentences.length >= 2) return 'multi-sentence'
  if (text.length <= 15) return 'single-word'
  if (text.length <= 50) return 'short-phrase'
  return 'single-sentence'
}

/** Split on sentence-ending punctuation followed by space + uppercase letter. */
function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(s => s.length > 0)
}

/**
 * Deterministic seeded variation from text content.
 * Returns a function that maps an index to a 0–1 float.
 */
function makeSeededRng(text) {
  const seedHex = createHash('sha256').update(text).digest('hex').slice(0, 8)
  const seed = parseInt(seedHex, 16)
  return (index) => ((seed * 31 + index * 17) % 1000) / 1000
}

/** Interpolate a value in [min, max] using a 0–1 factor. */
function lerp(min, max, t) {
  return Math.round(min + (max - min) * t)
}

// ── Prosody profiles (v2 — widened for audible variation) ───────────────────

const PROSODY_PROFILES = {
  'single-word':     { baseRate: -30, rateVar: 0,  basePitch: -12, pitchVar: 0, silenceMin: 0,   silenceMax: 0   },
  'short-phrase':    { baseRate: -28, rateVar: 0,  basePitch: -10, pitchVar: 0, silenceMin: 0,   silenceMax: 0   },
  'single-sentence': { baseRate: -25, rateVar: 0,  basePitch: -10, pitchVar: 0, silenceMin: 0,   silenceMax: 0   },
  'multi-sentence':  { baseRate: -25, rateVar: 10, basePitch: -10, pitchVar: 5, silenceMin: 400, silenceMax: 700 },
  'paragraph':       { baseRate: -23, rateVar: 12, basePitch: -10, pitchVar: 6, silenceMin: 500, silenceMax: 800 },
}

// ── ffmpeg helpers ──────────────────────────────────────────────────────────

/** Check that ffmpeg is available on PATH. Fails fast with install instructions. */
async function checkFfmpeg() {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-version'], { stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    proc.stdout.on('data', (d) => { output += d.toString() })
    proc.on('error', () => {
      reject(new Error(
        'ffmpeg not found on PATH.\n' +
        'Install it:\n' +
        '  macOS:   brew install ffmpeg\n' +
        '  Ubuntu:  sudo apt install ffmpeg\n' +
        '  Windows: winget install ffmpeg'
      ))
    })
    proc.on('close', (code) => {
      if (code === 0) resolve(output)
      else reject(new Error(`ffmpeg exited with code ${code}`))
    })
  })
}

/** Spawn ffmpeg with given args, pipe stdinBuffer to stdin, collect stdout as Buffer. */
function spawnFfmpeg(args, stdinBuffer) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] })
    const chunks = []
    let stderr = ''

    proc.stdout.on('data', (chunk) => chunks.push(chunk))
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    proc.on('error', (err) => reject(err))
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks))
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`))
      }
    })

    if (stdinBuffer) {
      proc.stdin.write(stdinBuffer)
    }
    proc.stdin.end()
  })
}

/** Decode an MP3 buffer to raw s16le/24kHz/mono PCM via ffmpeg. */
function decodeToRawPCM(mp3Buffer) {
  return spawnFfmpeg([
    '-i', 'pipe:0',
    '-f', 's16le',
    '-acodec', 'pcm_s16le',
    '-ar', String(PCM_SAMPLE_RATE),
    '-ac', '1',
    'pipe:1',
  ], mp3Buffer)
}

/** Generate exact silence as raw PCM (no ffmpeg needed). */
function generateSilencePCM(durationMs) {
  const numBytes = Math.round(PCM_SAMPLE_RATE * PCM_BYTES_PER_SAMPLE * durationMs / 1000)
  return Buffer.alloc(numBytes)
}

/**
 * Encode raw PCM to MP3 with warmth post-processing filters.
 * Filter chain:
 *   lowpass=f=7500  — rolls off harsh sibilance, warms voice
 *   aecho=0.8:0.88:25:0.15 — 25ms early reflection at 15% decay ("spacious room")
 */
function encodeWithWarmth(rawPCM, outputPath) {
  return spawnFfmpeg([
    '-f', 's16le',
    '-ar', String(PCM_SAMPLE_RATE),
    '-ac', '1',
    '-i', 'pipe:0',
    '-af', 'lowpass=f=7500,aecho=0.8:0.88:25:0.15',
    '-codec:a', 'libmp3lame',
    '-b:a', '96k',
    '-ar', String(PCM_SAMPLE_RATE),
    '-y',
    outputPath,
  ], rawPCM)
}

// ── TTS synthesis ───────────────────────────────────────────────────────────

/**
 * Send SSML body to Edge TTS websocket and collect audio as an in-memory Buffer.
 * Same websocket logic as the old synthesizeRaw, but returns Buffer instead of
 * writing to a file — avoids temp files for per-sentence MP3s.
 */
async function synthesizeToBuffer(ssmlBody) {
  return new Promise((resolve, reject) => {
    const requestId = randomBytes(16).toString('hex')
    const chromeMajor = CHROMIUM_FULL_VERSION.split('.')[0]

    const ws = new WebSocket(
      `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
      `?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
      `&Sec-MS-GEC=${generateSecMsGecToken()}` +
      `&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}`,
      {
        host: 'speech.platform.bing.com',
        origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Safari/537.36 Edg/${chromeMajor}.0.0.0`,
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    )

    const audioChunks = []
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('TTS websocket timeout (30s)'))
    }, 30000)

    ws.on('open', () => {
      // 1. Send speech config
      ws.send(
        `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: 'false',
                  wordBoundaryEnabled: 'true',
                },
                outputFormat: OUTPUT_FORMAT,
              },
            },
          },
        })
      )

      // 2. Send full SSML
      const ssml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">` +
        `<voice name="${VOICE}">` +
        ssmlBody +
        `</voice>` +
        `</speak>`

      ws.send(
        `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`
      )
    })

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        const separator = 'Path:audio\r\n'
        const idx = data.indexOf(separator)
        if (idx !== -1) {
          audioChunks.push(data.subarray(idx + separator.length))
        }
      } else {
        const message = data.toString()
        if (message.includes('Path:turn.end')) {
          clearTimeout(timeout)
          ws.close()
          resolve(Buffer.concat(audioChunks))
        }
      }
    })

    ws.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

/** Build minimal SSML prosody wrapper for a single sentence. */
function buildSentenceSSML(sentence, rate, pitch) {
  const pitchStr = pitch >= 0 ? `+${pitch}` : `${pitch}`
  return `<prosody rate="${rate}%" pitch="${pitchStr}Hz">${escapeXml(sentence)}</prosody>`
}

/** Sleep for ms milliseconds. */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Synthesize speech from plain text with split-sentence prosody variation +
 * ffmpeg silence gaps + warmth post-processing.
 *
 * Single-sentence cues: TTS → decode → warmth → MP3
 * Multi-sentence cues:  per-sentence TTS → decode → concat with silence → warmth → MP3
 */
async function synthesizeWithStyle(text, outputPath) {
  const category = classifyText(text)
  const profile = PROSODY_PROFILES[category]
  const sentences = splitSentences(text)
  const rng = makeSeededRng(text)

  const pcmChunks = []

  for (let si = 0; si < sentences.length; si++) {
    // Per-sentence rate/pitch variation
    const rateOffset = profile.rateVar === 0
      ? 0
      : Math.round((rng(si * 2) - 0.5) * 2 * profile.rateVar)
    const pitchOffset = profile.pitchVar === 0
      ? 0
      : Math.round((rng(si * 2 + 1) - 0.5) * 2 * profile.pitchVar)

    const rate = profile.baseRate + rateOffset
    const pitch = profile.basePitch + pitchOffset

    const ssml = buildSentenceSSML(sentences[si], rate, pitch)
    const mp3Buffer = await synthesizeToBuffer(ssml)
    const pcm = await decodeToRawPCM(mp3Buffer)
    pcmChunks.push(pcm)

    // Add silence gap between sentences (not after last)
    if (si < sentences.length - 1 && profile.silenceMin > 0) {
      const silenceMs = lerp(profile.silenceMin, profile.silenceMax, rng(si * 50 + 7))
      pcmChunks.push(generateSilencePCM(silenceMs))
    }

    // Rate-limit: 200ms delay between TTS calls to avoid throttling
    if (si < sentences.length - 1) {
      await sleep(200)
    }
  }

  // Concatenate all PCM chunks and encode with warmth
  const fullPCM = Buffer.concat(pcmChunks)
  await encodeWithWarmth(fullPCM, outputPath)
}

function hashText(text) {
  return createHash('sha256').update(`v${SSML_VERSION}:${text}`).digest('hex').slice(0, 12)
}

function padIndex(i, width = 3) {
  return String(i).padStart(width, '0')
}

async function main() {
  console.log('Generating neural voice cues with split-sentence synthesis + ffmpeg warmth...\n')
  console.log(`Voice:    ${VOICE}`)
  console.log(`Pipeline: v${SSML_VERSION} (per-sentence TTS + ffmpeg concat + warmth filter)`)
  console.log(`Format:   ${OUTPUT_FORMAT}\n`)

  // Fail fast if ffmpeg is not available
  await checkFfmpeg()

  // Ensure output directory exists
  mkdirSync(VOICE_DIR, { recursive: true })

  const manifest = {}
  let totalGenerated = 0
  let totalSkipped = 0

  for (const preset of guidedPresets) {
    const script = preset.guidanceScript
    if (!script || !script.voiceCues || script.voiceCues.length === 0) continue

    const trackId = preset.id
    const trackDir = resolve(VOICE_DIR, trackId)
    mkdirSync(trackDir, { recursive: true })

    // Sidecar file stores text hashes so we can skip unchanged cues
    const sidecarPath = resolve(trackDir, '.hashes.json')
    let existingHashes = {}
    if (existsSync(sidecarPath)) {
      try {
        existingHashes = JSON.parse(readFileSync(sidecarPath, 'utf-8'))
      } catch { /* regenerate all */ }
    }

    // Filter to spoken cues only (skip chimeOnly)
    const spokenCues = script.voiceCues.filter(c => !c.chimeOnly && c.text)

    console.log(`\n${preset.name} (${trackId}): ${spokenCues.length} spoken cues`)

    const filenames = []
    const newHashes = {}

    for (let i = 0; i < spokenCues.length; i++) {
      const cue = spokenCues[i]
      const filename = `${padIndex(i)}.mp3`
      const outputPath = resolve(trackDir, filename)
      const textHash = hashText(cue.text)

      filenames.push(filename)
      newHashes[filename] = textHash

      // Skip if file exists and text hasn't changed
      if (existsSync(outputPath) && existingHashes[filename] === textHash) {
        totalSkipped++
        continue
      }

      // Generate audio
      const sentences = splitSentences(cue.text)
      const sentenceInfo = sentences.length > 1 ? ` (${sentences.length} sentences)` : ''
      const preview = cue.text.length > 60 ? cue.text.slice(0, 57) + '...' : cue.text
      process.stdout.write(`  [${padIndex(i)}] ${preview}${sentenceInfo} `)

      try {
        await synthesizeWithStyle(cue.text, outputPath)
        totalGenerated++
        console.log('OK')
      } catch (err) {
        console.log(`FAILED: ${err.message}`)
      }
    }

    manifest[trackId] = filenames

    // Write sidecar hashes
    writeFileSync(sidecarPath, JSON.stringify(newHashes, null, 2))
  }

  // Write manifest
  const manifestPath = resolve(VOICE_DIR, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  console.log(`\n--- Summary ---`)
  console.log(`Generated: ${totalGenerated} files`)
  console.log(`Skipped (unchanged): ${totalSkipped} files`)
  console.log(`Manifest: ${manifestPath}`)
  console.log('\nDone!')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
