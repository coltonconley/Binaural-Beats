/**
 * Generates ambient sound WAV files procedurally.
 * Each file is a seamless ~30-second loop at 44100 Hz stereo 16-bit.
 *
 * Run: node scripts/generate-ambient.mjs
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'public', 'ambient')

const SAMPLE_RATE = 44100
const DURATION = 30 // seconds
const NUM_SAMPLES = SAMPLE_RATE * DURATION
const NUM_CHANNELS = 2

// ─── Utilities ─────────────────────────────────────────────

function clamp(v) {
  return Math.max(-1, Math.min(1, v))
}

/** Write a stereo 16-bit WAV file */
function writeWav(filename, leftChannel, rightChannel) {
  const numSamples = leftChannel.length
  const bytesPerSample = 2
  const dataSize = numSamples * NUM_CHANNELS * bytesPerSample
  const headerSize = 44
  const buffer = Buffer.alloc(headerSize + dataSize)

  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)

  // fmt chunk
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)           // chunk size
  buffer.writeUInt16LE(1, 20)            // PCM format
  buffer.writeUInt16LE(NUM_CHANNELS, 22) // channels
  buffer.writeUInt32LE(SAMPLE_RATE, 24)  // sample rate
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * bytesPerSample, 28) // byte rate
  buffer.writeUInt16LE(NUM_CHANNELS * bytesPerSample, 32) // block align
  buffer.writeUInt16LE(16, 34)           // bits per sample

  // data chunk
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    const l = Math.round(clamp(leftChannel[i]) * 32767)
    const r = Math.round(clamp(rightChannel[i]) * 32767)
    buffer.writeInt16LE(l, offset); offset += 2
    buffer.writeInt16LE(r, offset); offset += 2
  }

  const path = resolve(OUT_DIR, filename)
  writeFileSync(path, buffer)
  const kb = Math.round(buffer.length / 1024)
  console.log(`  ${filename} (${kb} KB)`)
}

/** Seeded pseudo-random for reproducibility */
function makeRng(seed = 42) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/** Apply a cosine crossfade at loop boundaries (first/last N samples) */
function crossfadeLoop(channel, fadeSamples = 4410) {
  for (let i = 0; i < fadeSamples; i++) {
    const t = i / fadeSamples
    const fadeIn = 0.5 * (1 - Math.cos(Math.PI * t))
    const fadeOut = 1 - fadeIn
    const endIdx = channel.length - fadeSamples + i
    const blended = channel[i] * fadeIn + channel[endIdx] * fadeOut
    channel[i] = blended
    channel[endIdx] = blended
  }
}

// ─── Sound Generators ──────────────────────────────────────

function generateRain() {
  const rng = makeRng(101)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Pink noise via Voss-McCartney algorithm
  function pinkNoise(rng) {
    const data = new Float32Array(NUM_SAMPLES)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < NUM_SAMPLES; i++) {
      const w = rng() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
    return data
  }

  const pinkL = pinkNoise(rng)
  const pinkR = pinkNoise(makeRng(202))

  // High-pass filter to remove rumble (simple 1-pole)
  const hpAlpha = 0.995
  let prevL = 0, prevR = 0, prevInL = 0, prevInR = 0
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const outL = hpAlpha * (prevL + pinkL[i] - prevInL)
    const outR = hpAlpha * (prevR + pinkR[i] - prevInR)
    prevInL = pinkL[i]; prevInR = pinkR[i]
    prevL = outL; prevR = outR

    // Amplitude modulation for "rain intensity" variation
    const slowMod = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.05 * i / SAMPLE_RATE)

    // Occasional louder drops (random impulses smoothed)
    const dropChance = rng()
    const drop = dropChance > 0.9997 ? 2.0 : 1.0

    left[i] = outL * 0.35 * slowMod * drop
    right[i] = outR * 0.35 * slowMod * drop
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateOcean() {
  const rng = makeRng(303)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Brown noise
  let lastL = 0, lastR = 0
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const wL = rng() * 2 - 1
    const wR = rng() * 2 - 1
    lastL = (lastL + 0.02 * wL) / 1.02
    lastR = (lastR + 0.02 * wR) / 1.02

    // Slow wave-like modulation (multiple overlapping waves)
    const t = i / SAMPLE_RATE
    const wave1 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.07 * t)
    const wave2 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.11 * t + 1.2)
    const wave3 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.03 * t + 2.5)
    const mod = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2)

    // Add some higher-frequency "surf" noise at wave peaks
    const surfNoise = (rng() * 2 - 1) * 0.15 * Math.pow(Math.max(0, wave1 - 0.6), 2) * 10

    left[i] = (lastL * 3.5 + surfNoise) * 0.35 * (0.3 + 0.7 * mod)
    right[i] = (lastR * 3.5 + surfNoise * 0.8) * 0.35 * (0.3 + 0.7 * mod)
  }

  // Gentle low-pass to smooth
  for (let pass = 0; pass < 2; pass++) {
    let pL = left[0], pR = right[0]
    for (let i = 1; i < NUM_SAMPLES; i++) {
      left[i] = pL = pL * 0.85 + left[i] * 0.15
      right[i] = pR = pR * 0.85 + right[i] * 0.15
    }
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateForest() {
  const rng = makeRng(404)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Gentle background wind (filtered pink noise, very quiet)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const w = rng() * 2 - 1
    b0 = 0.99886 * b0 + w * 0.0555179
    b1 = 0.99332 * b1 + w * 0.0750759
    b2 = 0.96900 * b2 + w * 0.1538520
    b3 = 0.86650 * b3 + w * 0.3104856
    b4 = 0.55000 * b4 + w * 0.5329522
    b5 = -0.7616 * b5 - w * 0.0168980
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
    b6 = w * 0.115926

    const windMod = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.04 * i / SAMPLE_RATE)
    left[i] = pink * 0.12 * windMod
    right[i] = pink * 0.10 * windMod
  }

  // Bird chirps — short sine sweeps at semi-random intervals
  const chirps = []
  let nextChirp = Math.floor(rng() * SAMPLE_RATE * 2)
  while (nextChirp < NUM_SAMPLES - SAMPLE_RATE) {
    const freq = 2000 + rng() * 3000        // 2-5 kHz
    const chirpLen = Math.floor(0.04 * SAMPLE_RATE + rng() * 0.08 * SAMPLE_RATE) // 40-120ms
    const pan = rng() * 2 - 1                // stereo position
    const numNotes = 1 + Math.floor(rng() * 4) // 1-4 notes per chirp
    const amplitude = 0.08 + rng() * 0.12

    for (let n = 0; n < numNotes; n++) {
      const noteStart = nextChirp + n * Math.floor(chirpLen * 1.3)
      const noteFreq = freq * (1 + (rng() - 0.5) * 0.3)
      chirps.push({ start: noteStart, len: chirpLen, freq: noteFreq, pan, amplitude })
    }

    nextChirp += Math.floor(SAMPLE_RATE * (1.5 + rng() * 4)) // 1.5-5.5s between chirps
  }

  for (const chirp of chirps) {
    for (let j = 0; j < chirp.len && chirp.start + j < NUM_SAMPLES; j++) {
      const t = j / SAMPLE_RATE
      const env = Math.sin(Math.PI * j / chirp.len) // smooth envelope
      const freqSweep = chirp.freq * (1 + 0.15 * (j / chirp.len)) // slight upward sweep
      const sample = Math.sin(2 * Math.PI * freqSweep * t) * env * chirp.amplitude
      const idx = chirp.start + j
      const lGain = 0.5 + 0.5 * Math.max(0, -chirp.pan)
      const rGain = 0.5 + 0.5 * Math.max(0, chirp.pan)
      left[idx] += sample * lGain
      right[idx] += sample * rGain
    }
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateFire() {
  const rng = makeRng(505)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Brown noise base (warm rumble)
  let lastL = 0, lastR = 0
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const wL = rng() * 2 - 1
    const wR = rng() * 2 - 1
    lastL = (lastL + 0.02 * wL) / 1.02
    lastR = (lastR + 0.02 * wR) / 1.02

    const base = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.06 * i / SAMPLE_RATE)
    left[i] = lastL * 3.0 * 0.3 * base
    right[i] = lastR * 3.0 * 0.3 * base
  }

  // Crackle layer — random short bursts of filtered noise
  for (let i = 0; i < NUM_SAMPLES; i++) {
    if (rng() > 0.998) {
      // Start a crackle
      const crackleLen = Math.floor(200 + rng() * 800) // 200-1000 samples
      const intensity = 0.15 + rng() * 0.25
      const panBias = rng() * 2 - 1
      for (let j = 0; j < crackleLen && i + j < NUM_SAMPLES; j++) {
        const env = Math.exp(-j / (crackleLen * 0.2)) // sharp attack, fast decay
        const noise = (rng() * 2 - 1) * env * intensity
        left[i + j] += noise * (0.6 + 0.4 * Math.max(0, -panBias))
        right[i + j] += noise * (0.6 + 0.4 * Math.max(0, panBias))
      }
    }
  }

  // Pop layer — very short loud pops
  for (let i = 0; i < NUM_SAMPLES; i++) {
    if (rng() > 0.99985) {
      const popLen = Math.floor(50 + rng() * 150)
      const intensity = 0.2 + rng() * 0.2
      for (let j = 0; j < popLen && i + j < NUM_SAMPLES; j++) {
        const env = Math.exp(-j / (popLen * 0.08))
        const noise = (rng() * 2 - 1) * env * intensity
        left[i + j] += noise
        right[i + j] += noise * 0.9
      }
    }
  }

  // Low-pass to warm it up
  let pL = left[0], pR = right[0]
  for (let i = 1; i < NUM_SAMPLES; i++) {
    left[i] = pL = pL * 0.7 + left[i] * 0.3
    right[i] = pR = pR * 0.7 + right[i] * 0.3
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateWind() {
  const rng = makeRng(606)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Pink noise base
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  const rng2 = makeRng(607)
  let c0 = 0, c1 = 0, c2 = 0, c3 = 0, c4 = 0, c5 = 0, c6 = 0

  for (let i = 0; i < NUM_SAMPLES; i++) {
    const wL = rng() * 2 - 1
    b0 = 0.99886 * b0 + wL * 0.0555179
    b1 = 0.99332 * b1 + wL * 0.0750759
    b2 = 0.96900 * b2 + wL * 0.1538520
    b3 = 0.86650 * b3 + wL * 0.3104856
    b4 = 0.55000 * b4 + wL * 0.5329522
    b5 = -0.7616 * b5 - wL * 0.0168980
    const pinkL = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + wL * 0.5362) * 0.11
    b6 = wL * 0.115926

    const wR = rng2() * 2 - 1
    c0 = 0.99886 * c0 + wR * 0.0555179
    c1 = 0.99332 * c1 + wR * 0.0750759
    c2 = 0.96900 * c2 + wR * 0.1538520
    c3 = 0.86650 * c3 + wR * 0.3104856
    c4 = 0.55000 * c4 + wR * 0.5329522
    c5 = -0.7616 * c5 - wR * 0.0168980
    const pinkR = (c0 + c1 + c2 + c3 + c4 + c5 + c6 + wR * 0.5362) * 0.11
    c6 = wR * 0.115926

    // Very slow modulation — gusting wind
    const t = i / SAMPLE_RATE
    const gust1 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.025 * t)
    const gust2 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.067 * t + 1.8)
    const gust3 = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.04 * t + 3.7)
    const mod = 0.2 + 0.8 * (gust1 * 0.5 + gust2 * 0.3 + gust3 * 0.2)

    left[i] = pinkL * 0.30 * mod
    right[i] = pinkR * 0.30 * mod
  }

  // Low-pass to make it "whooshy"
  for (let pass = 0; pass < 3; pass++) {
    let pL = left[0], pR = right[0]
    for (let i = 1; i < NUM_SAMPLES; i++) {
      left[i] = pL = pL * 0.92 + left[i] * 0.08
      right[i] = pR = pR * 0.92 + right[i] * 0.08
    }
  }

  // Boost volume after heavy filtering
  for (let i = 0; i < NUM_SAMPLES; i++) {
    left[i] *= 3.5
    right[i] *= 3.5
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateStream() {
  const rng = makeRng(707)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // White noise, band-pass filtered to mid-high frequencies
  for (let i = 0; i < NUM_SAMPLES; i++) {
    left[i] = (rng() * 2 - 1)
    right[i] = (rng() * 2 - 1)
  }

  // High-pass (remove low rumble)
  const hpA = 0.98
  let hpPrevL = 0, hpPrevR = 0, hpPrevInL = 0, hpPrevInR = 0
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const outL = hpA * (hpPrevL + left[i] - hpPrevInL)
    const outR = hpA * (hpPrevR + right[i] - hpPrevInR)
    hpPrevInL = left[i]; hpPrevInR = right[i]
    hpPrevL = outL; hpPrevR = outR
    left[i] = outL
    right[i] = outR
  }

  // Low-pass (remove harsh high end)
  for (let pass = 0; pass < 2; pass++) {
    let pL = left[0], pR = right[0]
    for (let i = 1; i < NUM_SAMPLES; i++) {
      left[i] = pL = pL * 0.75 + left[i] * 0.25
      right[i] = pR = pR * 0.75 + right[i] * 0.25
    }
  }

  // Irregular bubbling modulation
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE
    const bubble1 = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.13 * t)
    const bubble2 = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.31 * t + 0.7)
    const bubble3 = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.07 * t + 2.1)
    const mod = bubble1 * bubble2 * bubble3

    left[i] *= 0.25 * mod
    right[i] *= 0.25 * mod
  }

  // Add some gentle low-frequency water flow (brown noise undertone)
  let last = 0
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const w = rng() * 2 - 1
    last = (last + 0.02 * w) / 1.02
    const undertone = last * 2.0 * 0.10
    left[i] += undertone
    right[i] += undertone * 0.9
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

// ─── Main ──────────────────────────────────────────────────

const sounds = [
  { name: 'rain.wav', gen: generateRain },
  { name: 'ocean.wav', gen: generateOcean },
  { name: 'forest.wav', gen: generateForest },
  { name: 'fire.wav', gen: generateFire },
  { name: 'wind.wav', gen: generateWind },
  { name: 'stream.wav', gen: generateStream },
]

console.log('Generating ambient sounds...\n')

for (const { name, gen } of sounds) {
  const { left, right } = gen()
  writeWav(name, left, right)
}

console.log('\nDone! Files written to public/ambient/')
