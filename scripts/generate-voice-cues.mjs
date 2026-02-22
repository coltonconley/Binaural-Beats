/**
 * Generates neural TTS voice cue MP3 files for all guided meditation presets.
 *
 * Uses Microsoft's Edge TTS websocket directly (bypassing node-edge-tts's
 * hardcoded SSML template) for full control over voice, prosody, and output format.
 * Generates one MP3 per spoken voice cue (skipping chimeOnly cues).
 * Output: public/voice/{trackId}/{000}.mp3 + public/voice/manifest.json
 *
 * Run: npm run generate:voice
 * Requires: npm install --save-dev node-edge-tts tsx
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync, createWriteStream } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash, randomBytes } from 'crypto'
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
// JennyNeural has a naturally warmer, softer vocal quality than AriaNeural.
// Edge TTS doesn't support mstts:express-as styles, so we rely on prosody tuning
// and higher bitrate to preserve vocal warmth.
const VOICE = 'en-US-JennyNeural'
const RATE = '-25%'   // Noticeably slower, meditative pace
const PITCH = '-10Hz' // Lower for warm, soothing tone
const OUTPUT_FORMAT = 'audio-24khz-96kbitrate-mono-mp3'

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

/**
 * Synthesize speech using the Edge TTS websocket directly.
 * This bypasses node-edge-tts's hardcoded SSML template, giving us full
 * control over the output format and SSML structure.
 */
async function synthesizeWithStyle(text, outputPath) {
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

    const audioStream = createWriteStream(outputPath)
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error('TTS websocket timeout (30s)'))
    }, 30000)

    ws.on('open', () => {
      // 1. Send speech config with higher-quality output format
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

      // 2. Send SSML with prosody tuning for calm meditation voice
      const ssml = [
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">`,
        `<voice name="${VOICE}">`,
        `<prosody rate="${RATE}" pitch="${PITCH}">`,
        escapeXml(text),
        `</prosody>`,
        `</voice>`,
        `</speak>`,
      ].join('')

      ws.send(
        `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`
      )
    })

    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        // Extract audio data after the "Path:audio\r\n" header
        const separator = 'Path:audio\r\n'
        const idx = data.indexOf(separator)
        if (idx !== -1) {
          audioStream.write(data.subarray(idx + separator.length))
        }
      } else {
        const message = data.toString()
        if (message.includes('Path:turn.end')) {
          audioStream.end()
          audioStream.on('finish', () => {
            clearTimeout(timeout)
            ws.close()
            resolve()
          })
        }
      }
    })

    ws.on('error', (err) => {
      clearTimeout(timeout)
      audioStream.end()
      reject(err)
    })
  })
}

function hashText(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 12)
}

function padIndex(i, width = 3) {
  return String(i).padStart(width, '0')
}

async function main() {
  console.log('Generating neural voice cues...\n')
  console.log(`Voice:  ${VOICE}`)
  console.log(`Rate:   ${RATE}`)
  console.log(`Pitch:  ${PITCH}`)
  console.log(`Format: ${OUTPUT_FORMAT}\n`)

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
      const preview = cue.text.length > 60 ? cue.text.slice(0, 57) + '...' : cue.text
      process.stdout.write(`  [${padIndex(i)}] ${preview} `)

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
