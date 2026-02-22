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

// ─── Core Utilities ─────────────────────────────────────────

function clamp(v) {
  return Math.max(-1, Math.min(1, v))
}

function softClip(x) {
  if (x > 1) return 2 / 3
  if (x < -1) return -2 / 3
  return x - (x * x * x) / 3
}

/** Write a stereo 16-bit WAV file */
function writeWav(filename, leftChannel, rightChannel) {
  const numSamples = leftChannel.length
  const bytesPerSample = 2
  const dataSize = numSamples * NUM_CHANNELS * bytesPerSample
  const headerSize = 44
  const buffer = Buffer.alloc(headerSize + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)

  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(NUM_CHANNELS, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * bytesPerSample, 28)
  buffer.writeUInt16LE(NUM_CHANNELS * bytesPerSample, 32)
  buffer.writeUInt16LE(16, 34)

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

// ─── Shared DSP Utilities ───────────────────────────────────

/** Pink noise via Voss-McCartney algorithm */
function makePinkNoise(rng, numSamples) {
  const data = new Float32Array(numSamples)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < numSamples; i++) {
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

/** Brown noise via random walk */
function makeBrownNoise(rng, numSamples, step = 0.02) {
  const data = new Float32Array(numSamples)
  let last = 0
  for (let i = 0; i < numSamples; i++) {
    const w = rng() * 2 - 1
    last = (last + step * w) / (1 + step)
    data[i] = last
  }
  return data
}

/** 1-pole IIR low-pass filter in-place */
function lowPass(channel, alpha, passes = 1) {
  for (let p = 0; p < passes; p++) {
    let prev = channel[0]
    for (let i = 1; i < channel.length; i++) {
      channel[i] = prev = prev * alpha + channel[i] * (1 - alpha)
    }
  }
}

/** 1-pole IIR high-pass filter in-place */
function highPass(channel, alpha) {
  let prev = 0, prevIn = 0
  for (let i = 0; i < channel.length; i++) {
    const out = alpha * (prev + channel[i] - prevIn)
    prevIn = channel[i]
    prev = out
    channel[i] = out
  }
}

/** Stereo pan gains from position [-1, 1] */
function panGains(pan) {
  return {
    l: 0.5 + 0.5 * Math.max(0, -pan),
    r: 0.5 + 0.5 * Math.max(0, pan),
  }
}

// ─── Sound Generators ───────────────────────────────────────

function generateRain() {
  const rng = makeRng(101)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Layer A: Background drizzle — pink noise
  const drizzleL = makePinkNoise(makeRng(110), NUM_SAMPLES)
  const drizzleR = makePinkNoise(makeRng(111), NUM_SAMPLES)
  highPass(drizzleL, 0.993)
  highPass(drizzleR, 0.993)
  lowPass(drizzleL, 0.6)
  lowPass(drizzleR, 0.6)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE
    const am = 0.7 + 0.15 * Math.sin(2 * Math.PI * 0.047 * t) + 0.15 * Math.sin(2 * Math.PI * 0.071 * t)
    left[i] += drizzleL[i] * 0.20 * am
    right[i] += drizzleR[i] * 0.20 * am
  }

  // Layer B: Medium drops — white noise bursts
  let nextDrop = Math.floor(rng() * (SAMPLE_RATE / 30))
  while (nextDrop < NUM_SAMPLES) {
    const dropLen = 80 + Math.floor(rng() * 170)
    const gain = 0.06 + rng() * 0.12
    const pan = rng() * 2 - 1
    const pg = panGains(pan)
    for (let j = 0; j < dropLen && nextDrop + j < NUM_SAMPLES; j++) {
      const env = Math.exp(-j * 0.15 / (dropLen / 80))
      const noise = (rng() * 2 - 1) * env * gain
      left[nextDrop + j] += noise * pg.l
      right[nextDrop + j] += noise * pg.r
    }
    const rate = 25 + rng() * 15
    nextDrop += Math.floor(SAMPLE_RATE / rate)
  }

  // Layer C: Large foreground drops
  let nextBigDrop = Math.floor(rng() * (SAMPLE_RATE / 5))
  while (nextBigDrop < NUM_SAMPLES) {
    const dropLen = 400 + Math.floor(rng() * 800)
    const gain = 0.15 + rng() * 0.15
    const pan = (rng() * 2 - 1) * 0.6
    const pg = panGains(pan)
    const dropBuf = new Float32Array(dropLen)
    for (let j = 0; j < dropLen; j++) {
      dropBuf[j] = (rng() * 2 - 1) * Math.exp(-j * 0.003) * gain
    }
    lowPass(dropBuf, 0.5)
    for (let j = 0; j < dropLen && nextBigDrop + j < NUM_SAMPLES; j++) {
      left[nextBigDrop + j] += dropBuf[j] * pg.l
      right[nextBigDrop + j] += dropBuf[j] * pg.r
    }
    const rate = 3 + rng() * 5
    nextBigDrop += Math.floor(SAMPLE_RATE / rate)
  }

  // Post-mix LP to glue
  lowPass(left, 0.85)
  lowPass(right, 0.85)

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateOcean() {
  const rng = makeRng(303)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Layer A: Deep body — brown noise
  const bodyL = makeBrownNoise(makeRng(310), NUM_SAMPLES, 0.015)
  const bodyR = makeBrownNoise(makeRng(311), NUM_SAMPLES, 0.015)
  lowPass(bodyL, 0.90, 2)
  lowPass(bodyR, 0.90, 2)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const tidal = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.018 * i / SAMPLE_RATE)
    left[i] += bodyL[i] * 0.25 * tidal * 3.5
    right[i] += bodyR[i] * 0.25 * tidal * 3.5
  }

  // Layer B/C/D: Wave events with asymmetric envelopes
  const waveCount = 4 + Math.floor(rng() * 3)
  const waveDuration = NUM_SAMPLES / waveCount
  for (let w = 0; w < waveCount; w++) {
    const waveStart = Math.floor(w * waveDuration + (rng() - 0.5) * waveDuration * 0.3)
    const waveLen = Math.floor(waveDuration * (0.6 + rng() * 0.3))
    const riseEnd = Math.floor(waveLen * 0.6)
    const crashEnd = Math.floor(waveLen * 0.75)
    const pan = (rng() - 0.5) * 0.8
    const peakGain = 0.25 + rng() * 0.10

    for (let j = 0; j < waveLen; j++) {
      const idx = waveStart + j
      if (idx < 0 || idx >= NUM_SAMPLES) continue

      let env = 0
      if (j < riseEnd) {
        // Slow rise
        env = 0.5 * (1 - Math.cos(Math.PI * j / riseEnd))
      } else if (j < crashEnd) {
        // Crash peak
        env = 1.0
      } else {
        // Hissing retreat
        const retreatT = (j - crashEnd) / (waveLen - crashEnd)
        env = Math.pow(1 - retreatT, 1.5)
      }

      // Wave crash — white noise shaped by envelope
      const crashNoise = (rng() * 2 - 1) * env * peakGain
      // Sweeping LP: tighter at peak, looser at retreat
      const lpAlpha = j < crashEnd ? 0.4 : 0.4 + 0.45 * ((j - crashEnd) / Math.max(1, waveLen - crashEnd))

      const panSweep = pan + (j / waveLen - 0.5) * 0.3
      const pg = panGains(panSweep)
      left[idx] += crashNoise * pg.l
      right[idx] += crashNoise * pg.r

      // Foam/hiss during retreat
      if (j > crashEnd) {
        const retreatEnv = Math.pow(1 - (j - crashEnd) / (waveLen - crashEnd), 2)
        const foam = (rng() * 2 - 1) * retreatEnv * 0.12
        left[idx] += foam * pg.l
        right[idx] += foam * pg.r
      }
    }
  }

  // Post LP to smooth
  lowPass(left, 0.85, 2)
  lowPass(right, 0.85, 2)

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateForest() {
  const rng = makeRng(404)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Layer A: Wind bed — pink noise
  const windL = makePinkNoise(makeRng(410), NUM_SAMPLES)
  const windR = makePinkNoise(makeRng(411), NUM_SAMPLES)
  lowPass(windL, 0.82)
  lowPass(windR, 0.82)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE
    const am = 0.6 + 0.2 * Math.sin(2 * Math.PI * 0.04 * t) + 0.2 * Math.sin(2 * Math.PI * 0.023 * t)
    left[i] += windL[i] * 0.10 * am
    right[i] += windR[i] * 0.10 * am
  }

  // Layer B: Birds (3 species, FM synthesis)
  const birdRng = makeRng(420)
  // Robin: descending warble
  let nextRobin = Math.floor(birdRng() * SAMPLE_RATE * 3)
  while (nextRobin < NUM_SAMPLES - SAMPLE_RATE) {
    const noteCount = 2 + Math.floor(birdRng() * 4)
    const carrier = 3200 + birdRng() * 600
    const pan = birdRng() * 2 - 1
    const pg = panGains(pan)
    const amp = 0.06 + birdRng() * 0.06
    for (let n = 0; n < noteCount; n++) {
      const noteStart = nextRobin + n * Math.floor(SAMPLE_RATE * 0.12)
      const noteLen = Math.floor(SAMPLE_RATE * (0.06 + birdRng() * 0.06))
      const noteFreq = carrier * (1 - n * 0.04)
      const modFreq = 5 + birdRng() * 3
      for (let j = 0; j < noteLen && noteStart + j < NUM_SAMPLES; j++) {
        const t = j / SAMPLE_RATE
        const env = Math.sin(Math.PI * j / noteLen)
        const s = Math.sin(2 * Math.PI * noteFreq * t + 0.3 * Math.sin(2 * Math.PI * modFreq * t)) * env * amp
        left[noteStart + j] += s * pg.l
        right[noteStart + j] += s * pg.r
      }
    }
    nextRobin += Math.floor(SAMPLE_RATE * (3 + birdRng() * 5))
  }

  // Wren: rapid trill
  let nextWren = Math.floor(birdRng() * SAMPLE_RATE * 5)
  while (nextWren < NUM_SAMPLES - SAMPLE_RATE) {
    const noteCount = 8 + Math.floor(birdRng() * 8)
    const carrier = 4500 + birdRng() * 1000
    const pan = birdRng() * 2 - 1
    const pg = panGains(pan)
    const amp = 0.04 + birdRng() * 0.04
    for (let n = 0; n < noteCount; n++) {
      const noteStart = nextWren + n * Math.floor(SAMPLE_RATE * 0.04)
      const noteLen = Math.floor(SAMPLE_RATE * 0.03)
      const modFreq = 30 + birdRng() * 20
      for (let j = 0; j < noteLen && noteStart + j < NUM_SAMPLES; j++) {
        const t = j / SAMPLE_RATE
        const env = Math.sin(Math.PI * j / noteLen)
        const s = Math.sin(2 * Math.PI * carrier * t + 0.15 * Math.sin(2 * Math.PI * modFreq * t)) * env * amp
        left[noteStart + j] += s * pg.l
        right[noteStart + j] += s * pg.r
      }
    }
    nextWren += Math.floor(SAMPLE_RATE * (5 + birdRng() * 7))
  }

  // Dove: low coo
  let nextDove = Math.floor(birdRng() * SAMPLE_RATE * 8)
  while (nextDove < NUM_SAMPLES - SAMPLE_RATE * 2) {
    const carrier = 500 + birdRng() * 200
    const pan = (birdRng() - 0.5) * 0.8
    const pg = panGains(pan)
    const amp = 0.05 + birdRng() * 0.04
    for (let n = 0; n < 2; n++) {
      const noteStart = nextDove + n * Math.floor(SAMPLE_RATE * 0.4)
      const noteLen = Math.floor(SAMPLE_RATE * 0.3)
      const modFreq = 3 + birdRng() * 2
      for (let j = 0; j < noteLen && noteStart + j < NUM_SAMPLES; j++) {
        const t = j / SAMPLE_RATE
        const env = Math.sin(Math.PI * j / noteLen)
        const s = Math.sin(2 * Math.PI * carrier * t + 0.5 * Math.sin(2 * Math.PI * modFreq * t)) * env * amp
        left[noteStart + j] += s * pg.l
        right[noteStart + j] += s * pg.r
      }
    }
    nextDove += Math.floor(SAMPLE_RATE * (8 + birdRng() * 12))
  }

  // Layer C: Crickets — detuned sine pair with pulsing gate
  const cricketRng = makeRng(430)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE
    const gate = Math.sin(2 * Math.PI * 4 * t) > 0.3 ? 1 : 0
    const s = (Math.sin(2 * Math.PI * 4800 * t) + Math.sin(2 * Math.PI * 4815 * t)) * 0.5 * gate * 0.03
    left[i] += s * 0.6
    right[i] += s * 0.8
  }

  // Layer D: Leaf rustles — sparse pink noise bursts
  let nextRustle = Math.floor(rng() * SAMPLE_RATE * 3)
  while (nextRustle < NUM_SAMPLES) {
    const rustleLen = Math.floor(SAMPLE_RATE * (0.1 + rng() * 0.2))
    const gain = 0.04 + rng() * 0.04
    const pan = rng() * 2 - 1
    const pg = panGains(pan)
    const buf = makePinkNoise(makeRng(nextRustle & 0xffff), rustleLen)
    lowPass(buf, 0.65)
    for (let j = 0; j < rustleLen && nextRustle + j < NUM_SAMPLES; j++) {
      const env = Math.sin(Math.PI * j / rustleLen)
      left[nextRustle + j] += buf[j] * env * gain * pg.l
      right[nextRustle + j] += buf[j] * env * gain * pg.r
    }
    nextRustle += Math.floor(SAMPLE_RATE * (3 + rng() * 7))
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateFire() {
  const rng = makeRng(505)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Layer A: Low rumble — brown noise
  const rumbleL = makeBrownNoise(makeRng(510), NUM_SAMPLES, 0.02)
  const rumbleR = makeBrownNoise(makeRng(511), NUM_SAMPLES, 0.02)
  lowPass(rumbleL, 0.88, 2)
  lowPass(rumbleR, 0.88, 2)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const am = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.04 * i / SAMPLE_RATE)
    left[i] += rumbleL[i] * 0.25 * am * 3.0
    right[i] += rumbleR[i] * 0.25 * am * 3.0
  }

  // Layer B: Steady burn hiss — pink noise
  const hissL = makePinkNoise(makeRng(520), NUM_SAMPLES)
  const hissR = makePinkNoise(makeRng(521), NUM_SAMPLES)
  highPass(hissL, 0.992)
  highPass(hissR, 0.992)
  lowPass(hissL, 0.55)
  lowPass(hissR, 0.55)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const am = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.06 * i / SAMPLE_RATE)
    left[i] += hissL[i] * 0.08 * am
    right[i] += hissR[i] * 0.08 * am
  }

  // Layer C: Small crackles
  const crackleRng = makeRng(530)
  let nextCrackle = Math.floor(crackleRng() * (SAMPLE_RATE / 3))
  while (nextCrackle < NUM_SAMPLES) {
    const crackleLen = 100 + Math.floor(crackleRng() * 500)
    const gain = 0.10 + crackleRng() * 0.20
    const pan = crackleRng() * 2 - 1
    const pg = panGains(pan)
    for (let j = 0; j < crackleLen && nextCrackle + j < NUM_SAMPLES; j++) {
      const env = Math.exp(-j * 0.12 / (crackleLen / 100))
      const noise = (crackleRng() * 2 - 1) * env * gain
      left[nextCrackle + j] += noise * pg.l
      right[nextCrackle + j] += noise * pg.r
    }
    nextCrackle += Math.floor(SAMPLE_RATE / (2 + crackleRng()))
  }

  // Layer D: Large pops — two-stage envelope
  const popRng = makeRng(540)
  let nextPop = Math.floor(popRng() * SAMPLE_RATE * 2)
  while (nextPop < NUM_SAMPLES) {
    const snapLen = 30 + Math.floor(popRng() * 50)
    const sizzleLen = 200 + Math.floor(popRng() * 600)
    const totalLen = snapLen + sizzleLen
    const gain = 0.20 + popRng() * 0.25
    const pan = (popRng() - 0.5) * 0.6
    const pg = panGains(pan)
    for (let j = 0; j < totalLen && nextPop + j < NUM_SAMPLES; j++) {
      let env
      if (j < snapLen) {
        env = Math.exp(-j / (snapLen * 0.08)) * 1.5
      } else {
        env = 0.4 * Math.exp(-(j - snapLen) / (sizzleLen * 0.25))
      }
      const noise = (popRng() * 2 - 1) * env * gain
      left[nextPop + j] += noise * pg.l
      right[nextPop + j] += noise * pg.r
    }
    nextPop += Math.floor(SAMPLE_RATE * (0.15 + popRng() * 0.25))
  }

  // Layer E: Wood settling thuds — very sparse
  const thudRng = makeRng(550)
  let nextThud = Math.floor(thudRng() * SAMPLE_RATE * 10)
  while (nextThud < NUM_SAMPLES) {
    const thudLen = Math.floor(SAMPLE_RATE * 0.15)
    const thudBuf = makeBrownNoise(makeRng(nextThud & 0xffff), thudLen, 0.04)
    lowPass(thudBuf, 0.92)
    const gain = 0.15 + thudRng() * 0.10
    for (let j = 0; j < thudLen && nextThud + j < NUM_SAMPLES; j++) {
      const env = Math.exp(-j / (thudLen * 0.2))
      const s = thudBuf[j] * env * gain * 3.0
      left[nextThud + j] += s
      right[nextThud + j] += s * 0.9
    }
    // Follow-up crackles after thud
    for (let c = 0; c < 3 + Math.floor(thudRng() * 3); c++) {
      const cStart = nextThud + Math.floor(SAMPLE_RATE * (0.05 + thudRng() * 0.3))
      const cLen = 80 + Math.floor(thudRng() * 200)
      const cGain = 0.08 + thudRng() * 0.12
      for (let j = 0; j < cLen && cStart + j < NUM_SAMPLES; j++) {
        const env = Math.exp(-j * 0.15 / (cLen / 80))
        const noise = (thudRng() * 2 - 1) * env * cGain
        left[cStart + j] += noise
        right[cStart + j] += noise * 0.85
      }
    }
    nextThud += Math.floor(SAMPLE_RATE * (12 + thudRng() * 18))
  }

  // Post LP
  lowPass(left, 0.75)
  lowPass(right, 0.75)

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateWind() {
  const rng = makeRng(606)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Layer A: Main body — pink noise
  const bodyL = makePinkNoise(makeRng(610), NUM_SAMPLES)
  const bodyR = makePinkNoise(makeRng(611), NUM_SAMPLES)
  lowPass(bodyL, 0.88, 2)
  lowPass(bodyR, 0.88, 2)

  // Gust system: schedule 6-10 gust events
  const gustRng = makeRng(620)
  const gustCount = 6 + Math.floor(gustRng() * 5)
  const gustSpacing = NUM_SAMPLES / gustCount
  const gusts = []
  for (let g = 0; g < gustCount; g++) {
    const center = g * gustSpacing + (gustRng() - 0.5) * gustSpacing * 0.5
    const attack = SAMPLE_RATE * (0.5 + gustRng() * 1.5)
    const hold = SAMPLE_RATE * (0.3 + gustRng() * 0.7)
    const release = SAMPLE_RATE * (1 + gustRng() * 3)
    const peak = 1.5 + gustRng() * 2.0
    const panTarget = (gustRng() - 0.5) * 1.4
    gusts.push({ center, attack, hold, release, peak, panTarget })
  }

  // Build gust envelope
  const gustEnv = new Float32Array(NUM_SAMPLES)
  const gustPan = new Float32Array(NUM_SAMPLES)
  gustEnv.fill(1.0)
  for (const g of gusts) {
    const start = Math.floor(g.center - g.attack - g.hold / 2)
    const end = Math.floor(g.center + g.hold / 2 + g.release)
    for (let i = Math.max(0, start); i < Math.min(NUM_SAMPLES, end); i++) {
      const relI = i - start
      let env = 1.0
      if (relI < g.attack) {
        env = 0.5 * (1 - Math.cos(Math.PI * relI / g.attack))
      } else if (relI < g.attack + g.hold) {
        env = 1.0
      } else {
        const retreatT = (relI - g.attack - g.hold) / g.release
        env = 0.5 * (1 + Math.cos(Math.PI * Math.min(1, retreatT)))
      }
      const factor = 1.0 + (g.peak - 1.0) * env
      if (factor > gustEnv[i]) {
        gustEnv[i] = factor
        gustPan[i] = g.panTarget * env
      }
    }
  }

  for (let i = 0; i < NUM_SAMPLES; i++) {
    const pg = panGains(gustPan[i] * 0.3)
    left[i] += bodyL[i] * 0.22 * gustEnv[i] * pg.l
    right[i] += bodyR[i] * 0.22 * gustEnv[i] * pg.r
  }

  // Layer B: Breathy highs — only audible during gusts
  const breathL = new Float32Array(NUM_SAMPLES)
  const breathR = new Float32Array(NUM_SAMPLES)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    breathL[i] = rng() * 2 - 1
    breathR[i] = rng() * 2 - 1
  }
  highPass(breathL, 0.985)
  highPass(breathR, 0.985)
  lowPass(breathL, 0.70)
  lowPass(breathR, 0.70)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const gustGate = Math.max(0, gustEnv[i] - 1.5) / 2.0
    left[i] += breathL[i] * 0.15 * gustGate
    right[i] += breathR[i] * 0.15 * gustGate
  }

  // Layer C: Sub-bass pressure — follows gusts with lag
  const subL = makeBrownNoise(makeRng(630), NUM_SAMPLES)
  const subR = makeBrownNoise(makeRng(631), NUM_SAMPLES)
  lowPass(subL, 0.95, 3)
  lowPass(subR, 0.95, 3)
  let laggedGust = 1.0
  for (let i = 0; i < NUM_SAMPLES; i++) {
    laggedGust += (gustEnv[i] - laggedGust) * 0.00005
    left[i] += subL[i] * 0.08 * laggedGust * 3.0
    right[i] += subR[i] * 0.08 * laggedGust * 3.0
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateStream() {
  const rng = makeRng(707)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Brown-noise turbulence control signals
  const turbA = makeBrownNoise(makeRng(710), NUM_SAMPLES, 0.01)
  const turbB = makeBrownNoise(makeRng(711), NUM_SAMPLES, 0.008)
  const turbC = makeBrownNoise(makeRng(712), NUM_SAMPLES, 0.012)

  // Layer A: Main flow — white noise modulated by turbulence
  const flowL = new Float32Array(NUM_SAMPLES)
  const flowR = new Float32Array(NUM_SAMPLES)
  const flowRngL = makeRng(720)
  const flowRngR = makeRng(721)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    flowL[i] = (flowRngL() * 2 - 1)
    flowR[i] = (flowRngR() * 2 - 1)
  }
  highPass(flowL, 0.98)
  highPass(flowR, 0.98)
  lowPass(flowL, 0.75, 2)
  lowPass(flowR, 0.75, 2)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const mod = 0.6 + 0.4 * (turbA[i] * 5 + 0.5)
    left[i] += flowL[i] * 0.20 * Math.max(0.3, Math.min(1.2, mod))
    right[i] += flowR[i] * 0.20 * Math.max(0.3, Math.min(1.2, mod))
  }

  // Layer B: Triple trickle layers at different frequency ranges
  const trickleConfigs = [
    { seed: 730, hpA: 0.96, lpA: 0.85, gain: 0.06, pan: -0.5, turbIdx: 0 },
    { seed: 731, hpA: 0.98, lpA: 0.70, gain: 0.05, pan: 0.3, turbIdx: 1 },
    { seed: 732, hpA: 0.99, lpA: 0.55, gain: 0.04, pan: 0.6, turbIdx: 2 },
  ]
  const turbs = [turbA, turbB, turbC]
  for (const tc of trickleConfigs) {
    const trickle = new Float32Array(NUM_SAMPLES)
    const tRng = makeRng(tc.seed)
    for (let i = 0; i < NUM_SAMPLES; i++) trickle[i] = tRng() * 2 - 1
    highPass(trickle, tc.hpA)
    lowPass(trickle, tc.lpA)
    const pg = panGains(tc.pan)
    const turb = turbs[tc.turbIdx]
    for (let i = 0; i < NUM_SAMPLES; i++) {
      const mod = 0.5 + 0.5 * (turb[i] * 6 + 0.5)
      const s = trickle[i] * tc.gain * Math.max(0.2, Math.min(1.3, mod))
      left[i] += s * pg.l
      right[i] += s * pg.r
    }
  }

  // Layer C: Bubbles — noise+sine hybrid bursts
  const bubbleRng = makeRng(740)
  let nextBubble = Math.floor(bubbleRng() * (SAMPLE_RATE / 12))
  while (nextBubble < NUM_SAMPLES) {
    const freq = 800 + bubbleRng() * 1700
    const bubbleLen = Math.floor(SAMPLE_RATE * (0.01 + bubbleRng() * 0.03))
    const gain = 0.03 + bubbleRng() * 0.05
    const pan = (bubbleRng() - 0.5) * 1.2
    const pg = panGains(pan)
    for (let j = 0; j < bubbleLen && nextBubble + j < NUM_SAMPLES; j++) {
      const t = j / SAMPLE_RATE
      const env = Math.exp(-j / (bubbleLen * 0.3))
      const s = (Math.sin(2 * Math.PI * freq * t) * 0.7 + (bubbleRng() * 2 - 1) * 0.3) * env * gain
      left[nextBubble + j] += s * pg.l
      right[nextBubble + j] += s * pg.r
    }
    const rate = 8 + bubbleRng() * 7
    nextBubble += Math.floor(SAMPLE_RATE / rate)
  }

  // Layer D: Splashes with follow-up drips
  const splashRng = makeRng(750)
  let nextSplash = Math.floor(splashRng() * SAMPLE_RATE * 2)
  while (nextSplash < NUM_SAMPLES) {
    const splashLen = Math.floor(SAMPLE_RATE * (0.05 + splashRng() * 0.1))
    const gain = 0.08 + splashRng() * 0.10
    const pan = (splashRng() - 0.5) * 0.8
    const pg = panGains(pan)
    for (let j = 0; j < splashLen && nextSplash + j < NUM_SAMPLES; j++) {
      const env = Math.exp(-j / (splashLen * 0.15))
      const noise = (splashRng() * 2 - 1) * env * gain
      left[nextSplash + j] += noise * pg.l
      right[nextSplash + j] += noise * pg.r
    }
    // Follow-up drips
    for (let d = 0; d < 2 + Math.floor(splashRng() * 3); d++) {
      const dStart = nextSplash + Math.floor(SAMPLE_RATE * (0.08 + splashRng() * 0.2))
      const dLen = Math.floor(SAMPLE_RATE * 0.015)
      const dGain = 0.03 + splashRng() * 0.04
      const dFreq = 1200 + splashRng() * 1500
      for (let j = 0; j < dLen && dStart + j < NUM_SAMPLES; j++) {
        const t = j / SAMPLE_RATE
        const env = Math.exp(-j / (dLen * 0.25))
        const s = Math.sin(2 * Math.PI * dFreq * t) * env * dGain
        left[dStart + j] += s * pg.l
        right[dStart + j] += s * pg.r
      }
    }
    nextSplash += Math.floor(SAMPLE_RATE * (1.5 + splashRng() * 2))
  }

  // Brown noise undertone
  const undertoneL = makeBrownNoise(makeRng(760), NUM_SAMPLES)
  const undertoneR = makeBrownNoise(makeRng(761), NUM_SAMPLES)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    left[i] += undertoneL[i] * 0.15 * 3.0
    right[i] += undertoneR[i] * 0.15 * 3.0 * 0.9
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateRainTinRoof() {
  const rng = makeRng(808)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Layer A: Room tone — quiet brown noise
  const roomL = makeBrownNoise(makeRng(810), NUM_SAMPLES)
  const roomR = makeBrownNoise(makeRng(811), NUM_SAMPLES)
  lowPass(roomL, 0.90)
  lowPass(roomR, 0.90)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    left[i] += roomL[i] * 0.05 * 3.0
    right[i] += roomR[i] * 0.05 * 3.0
  }

  // Pre-generate roof resonant modes
  const roofModes = [880, 1050, 1320, 1580, 1760, 2100, 2400, 2750, 3000, 3200, 3500, 3800]

  // Layer B: Dense small pings — 40-70/sec
  const pingRng = makeRng(820)
  let nextPing = Math.floor(pingRng() * (SAMPLE_RATE / 60))
  while (nextPing < NUM_SAMPLES) {
    const modeIdx = Math.floor(pingRng() * roofModes.length)
    const freq = roofModes[modeIdx] * (0.95 + pingRng() * 0.10)
    const pingLen = Math.floor(SAMPLE_RATE * 0.015)
    const gain = 0.04 + pingRng() * 0.10
    const pan = (pingRng() - 0.5) * 1.6
    const pg = panGains(pan)
    for (let j = 0; j < pingLen && nextPing + j < NUM_SAMPLES; j++) {
      const t = j / SAMPLE_RATE
      const env = Math.exp(-j * 0.08 / (pingLen / SAMPLE_RATE / 0.015))
      const sine = Math.sin(2 * Math.PI * freq * t) * 0.7
      const noise = (pingRng() * 2 - 1) * 0.3
      const s = (sine + noise) * env * gain
      left[nextPing + j] += s * pg.l
      right[nextPing + j] += s * pg.r
    }
    const rate = 40 + pingRng() * 30
    nextPing += Math.floor(SAMPLE_RATE / rate)
  }

  // Layer C: Medium/large pings — 5-12/sec
  const bigPingRng = makeRng(830)
  let nextBigPing = Math.floor(bigPingRng() * (SAMPLE_RATE / 8))
  while (nextBigPing < NUM_SAMPLES) {
    const modeIdx = Math.floor(bigPingRng() * 6) // lower modes only
    const freq = roofModes[modeIdx] * (0.95 + bigPingRng() * 0.10)
    const pingLen = Math.floor(SAMPLE_RATE * 0.04)
    const gain = 0.12 + bigPingRng() * 0.15
    const pan = (bigPingRng() - 0.5) * 1.2
    const pg = panGains(pan)
    for (let j = 0; j < pingLen && nextBigPing + j < NUM_SAMPLES; j++) {
      const t = j / SAMPLE_RATE
      const env = Math.exp(-j * 0.15 / (pingLen / SAMPLE_RATE / 0.04))
      const sine = Math.sin(2 * Math.PI * freq * t) * 0.7
      const noise = (bigPingRng() * 2 - 1) * 0.3
      const s = (sine + noise) * env * gain
      left[nextBigPing + j] += s * pg.l
      right[nextBigPing + j] += s * pg.r
    }
    const rate = 5 + bigPingRng() * 7
    nextBigPing += Math.floor(SAMPLE_RATE / rate)
  }

  // Layer D: Rain wash background — band-passed pink noise
  const washL = makePinkNoise(makeRng(840), NUM_SAMPLES)
  const washR = makePinkNoise(makeRng(841), NUM_SAMPLES)
  highPass(washL, 0.99)
  highPass(washR, 0.99)
  lowPass(washL, 0.65)
  lowPass(washR, 0.65)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    left[i] += washL[i] * 0.08
    right[i] += washR[i] * 0.08
  }

  // Layer E: Simple room reverb — delay taps
  const delayA = Math.floor(SAMPLE_RATE * 0.020)
  const delayB = Math.floor(SAMPLE_RATE * 0.055)
  const reverbL = new Float32Array(NUM_SAMPLES)
  const reverbR = new Float32Array(NUM_SAMPLES)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    if (i >= delayA) {
      reverbL[i] += left[i - delayA] * 0.15
      reverbR[i] += right[i - delayA] * 0.15
    }
    if (i >= delayB) {
      reverbL[i] += left[i - delayB] * 0.08
      reverbR[i] += right[i - delayB] * 0.08
    }
  }
  lowPass(reverbL, 0.70)
  lowPass(reverbR, 0.70)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    left[i] += reverbL[i]
    right[i] += reverbR[i]
  }

  crossfadeLoop(left)
  crossfadeLoop(right)
  return { left, right }
}

function generateRainOnLeaves() {
  const rng = makeRng(909)
  const left = new Float32Array(NUM_SAMPLES)
  const right = new Float32Array(NUM_SAMPLES)

  // Layer A: Dense leaf patter — pink noise with amplitude granulation
  const patterL = makePinkNoise(makeRng(910), NUM_SAMPLES)
  const patterR = makePinkNoise(makeRng(911), NUM_SAMPLES)
  // Amplitude granulation: random-gain micro-segments
  const granRng = makeRng(912)
  let segStart = 0
  while (segStart < NUM_SAMPLES) {
    const segLen = 20 + Math.floor(granRng() * 60)
    const segGain = 0.3 + granRng() * 0.7
    for (let j = 0; j < segLen && segStart + j < NUM_SAMPLES; j++) {
      patterL[segStart + j] *= segGain
      patterR[segStart + j] *= segGain
    }
    segStart += segLen
  }
  highPass(patterL, 0.98)
  highPass(patterR, 0.98)
  lowPass(patterL, 0.60, 2)
  lowPass(patterR, 0.60, 2)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    left[i] += patterL[i] * 0.22
    right[i] += patterR[i] * 0.22
  }

  // Layer B: Rustle texture — white noise with turbulence modulation
  const rustleL = new Float32Array(NUM_SAMPLES)
  const rustleR = new Float32Array(NUM_SAMPLES)
  const rustleRng = makeRng(920)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    rustleL[i] = rustleRng() * 2 - 1
    rustleR[i] = rustleRng() * 2 - 1
  }
  highPass(rustleL, 0.97)
  highPass(rustleR, 0.97)
  lowPass(rustleL, 0.65)
  lowPass(rustleR, 0.65)
  const rustleTurb = makeBrownNoise(makeRng(921), NUM_SAMPLES, 0.008)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const mod = 0.4 + 0.6 * Math.max(0, Math.min(1, rustleTurb[i] * 5 + 0.5))
    left[i] += rustleL[i] * 0.05 * mod
    right[i] += rustleR[i] * 0.05 * mod
  }

  // Layer C: Leaf-edge drips — irregular clusters
  const dripRng = makeRng(930)
  let nextCluster = Math.floor(dripRng() * SAMPLE_RATE)
  while (nextCluster < NUM_SAMPLES) {
    const clusterSize = 2 + Math.floor(dripRng() * 4)
    for (let d = 0; d < clusterSize; d++) {
      const dripStart = nextCluster + Math.floor(d * SAMPLE_RATE * (0.1 + dripRng() * 0.15))
      const dripLen = Math.floor(SAMPLE_RATE * (0.01 + dripRng() * 0.02))
      const gain = 0.06 + dripRng() * 0.10
      const pan = (dripRng() - 0.5) * 1.4
      const pg = panGains(pan)
      const dripBuf = new Float32Array(dripLen)
      for (let j = 0; j < dripLen; j++) {
        dripBuf[j] = (dripRng() * 2 - 1) * Math.exp(-j / (dripLen * 0.25))
      }
      lowPass(dripBuf, 0.55)
      for (let j = 0; j < dripLen && dripStart + j < NUM_SAMPLES; j++) {
        left[dripStart + j] += dripBuf[j] * gain * pg.l
        right[dripStart + j] += dripBuf[j] * gain * pg.r
      }
    }
    nextCluster += Math.floor(SAMPLE_RATE * (0.8 + dripRng() * 1.5))
  }

  // Layer D: Leaf dumps — large soft bursts with drip-rate increase
  const dumpRng = makeRng(940)
  let nextDump = Math.floor(dumpRng() * SAMPLE_RATE * 10)
  while (nextDump < NUM_SAMPLES) {
    const dumpLen = Math.floor(SAMPLE_RATE * (0.15 + dumpRng() * 0.2))
    const gain = 0.10 + dumpRng() * 0.08
    const pan = (dumpRng() - 0.5) * 0.6
    const pg = panGains(pan)
    const dumpBuf = makePinkNoise(makeRng(nextDump & 0xffff), dumpLen)
    lowPass(dumpBuf, 0.55)
    for (let j = 0; j < dumpLen && nextDump + j < NUM_SAMPLES; j++) {
      const env = Math.sin(Math.PI * j / dumpLen)
      left[nextDump + j] += dumpBuf[j] * env * gain * pg.l
      right[nextDump + j] += dumpBuf[j] * env * gain * pg.r
    }
    // Brief drip-rate increase after dump
    for (let d = 0; d < 4 + Math.floor(dumpRng() * 4); d++) {
      const dStart = nextDump + dumpLen + Math.floor(dumpRng() * SAMPLE_RATE * 0.5)
      const dLen = Math.floor(SAMPLE_RATE * 0.012)
      const dGain = 0.04 + dumpRng() * 0.06
      for (let j = 0; j < dLen && dStart + j < NUM_SAMPLES; j++) {
        const env = Math.exp(-j / (dLen * 0.2))
        const noise = (dumpRng() * 2 - 1) * env * dGain
        left[dStart + j] += noise * pg.l
        right[dStart + j] += noise * pg.r
      }
    }
    nextDump += Math.floor(SAMPLE_RATE * (10 + dumpRng() * 15))
  }

  // Layer E: Sub-bed — brown noise
  const subL = makeBrownNoise(makeRng(950), NUM_SAMPLES)
  const subR = makeBrownNoise(makeRng(951), NUM_SAMPLES)
  lowPass(subL, 0.93, 2)
  lowPass(subR, 0.93, 2)
  for (let i = 0; i < NUM_SAMPLES; i++) {
    left[i] += subL[i] * 0.06 * 3.0
    right[i] += subR[i] * 0.06 * 3.0
  }

  // Post LP — warmest sound in the set
  lowPass(left, 0.72)
  lowPass(right, 0.72)

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
  { name: 'rain-tin-roof.wav', gen: generateRainTinRoof },
  { name: 'rain-on-leaves.wav', gen: generateRainOnLeaves },
]

console.log('Generating ambient sounds...\n')

for (const { name, gen } of sounds) {
  const { left, right } = gen()
  writeWav(name, left, right)
}

console.log('\nDone! Files written to public/ambient/')
