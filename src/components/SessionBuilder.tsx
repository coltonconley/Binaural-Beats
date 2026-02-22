import { useState, useEffect, useCallback, useMemo } from 'react'
import type { SessionPreset, NoiseType, AmbientSoundType, CarrierLayer, FrequencyPoint, BrainwaveBand } from '../types'
import { EnvelopeEditor } from './EnvelopeEditor'
import { usePreviewTone } from '../hooks/usePreviewTone'
import { ambientSounds } from '../audio/ambientSounds'

interface Props {
  editingPreset?: SessionPreset | null
  onSave: (preset: SessionPreset) => void
  onClose: () => void
}

const EMOJI_OPTIONS = [
  '🎵', '🧠', '🌊', '🌙', '🔮', '💎', '🎯', '⚡', '🌿', '🍃',
  '💡', '🧘', '✨', '🔷', '🎶', '🌈', '💤', '🌸', '🎧', '🪷',
  '🌀', '🫧', '🌟', '🦋',
]

const COLOR_OPTIONS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#22c55e', '#14b8a6', '#6366f1', '#a855f7',
]

const MIN_DURATION = 300   // 5 min
const MAX_DURATION = 7200  // 120 min
const DURATION_STEP = 300  // 5 min

function deriveBand(envelope: FrequencyPoint[]): BrainwaveBand {
  const minFreq = envelope.reduce((min, p) => Math.min(min, p.beatFreq), Infinity)
  if (minFreq < 4) return 'delta'
  if (minFreq < 8) return 'theta'
  if (minFreq < 13) return 'alpha'
  if (minFreq < 30) return 'beta'
  return 'gamma'
}

function createDefaultEnvelope(duration: number): FrequencyPoint[] {
  return [
    { time: 0, beatFreq: 10 },
    { time: Math.round(duration * 0.15), beatFreq: 10 },
    { time: Math.round(duration * 0.35), beatFreq: 6 },
    { time: Math.round(duration * 0.75), beatFreq: 6 },
    { time: duration, beatFreq: 10 },
  ]
}

function scaleEnvelope(envelope: FrequencyPoint[], oldDuration: number, newDuration: number): FrequencyPoint[] {
  if (oldDuration === 0) return createDefaultEnvelope(newDuration)
  return envelope.map((p, i) => {
    if (i === 0) return { ...p, time: 0 }
    if (i === envelope.length - 1) return { ...p, time: newDuration }
    return { ...p, time: Math.round((p.time / oldDuration) * newDuration) }
  })
}

function isValid(
  name: string,
  duration: number,
  carriers: CarrierLayer[],
  envelope: FrequencyPoint[],
): boolean {
  if (!name.trim()) return false
  if (duration < MIN_DURATION || duration > MAX_DURATION) return false
  if (carriers.length < 1 || carriers.length > 4) return false
  if (carriers.some((c) => c.carrierFreq < 20 || c.carrierFreq > 1000)) return false
  if (envelope.length < 2 || envelope.length > 10) return false
  if (envelope.some((p) => p.beatFreq < 0.5 || p.beatFreq > 100)) return false
  if (envelope[0].time !== 0) return false
  if (envelope[envelope.length - 1].time !== duration) return false
  for (let i = 1; i < envelope.length; i++) {
    if (envelope[i].time <= envelope[i - 1].time) return false
  }
  return true
}

export function SessionBuilder({ editingPreset, onSave, onClose }: Props) {
  const isEditing = !!editingPreset

  const [name, setName] = useState(editingPreset?.name ?? '')
  const [description, setDescription] = useState(editingPreset?.description ?? '')
  const [icon, setIcon] = useState(editingPreset?.icon ?? '🎵')
  const [color, setColor] = useState(editingPreset?.color ?? '#3b82f6')
  const [duration, setDuration] = useState(editingPreset?.duration ?? 1800)
  const [carriers, setCarriers] = useState<CarrierLayer[]>(
    editingPreset?.carriers ?? [{ carrierFreq: 200, gainDb: 0 }],
  )
  const [envelope, setEnvelope] = useState<FrequencyPoint[]>(
    editingPreset?.frequencyEnvelope ?? createDefaultEnvelope(1800),
  )
  const [noiseType, setNoiseType] = useState<NoiseType>(editingPreset?.noiseType ?? 'pink')
  const [noiseVolume, setNoiseVolume] = useState(Math.round((editingPreset?.noiseVolume ?? 0.3) * 100))
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>(editingPreset?.ambientSound ?? 'none')
  const [ambientVolume, setAmbientVolume] = useState(Math.round((editingPreset?.ambientVolume ?? 0.3) * 100))
  const [hasReturnPhase, setHasReturnPhase] = useState(editingPreset?.hasReturnPhase ?? true)
  const [isPreviewing, setIsPreviewing] = useState(false)

  const preview = usePreviewTone()

  const valid = useMemo(() => isValid(name, duration, carriers, envelope), [name, duration, carriers, envelope])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        preview.stop()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, preview])

  const handleDurationChange = useCallback((newDuration: number) => {
    const clamped = Math.max(MIN_DURATION, Math.min(MAX_DURATION, newDuration))
    setEnvelope((prev) => scaleEnvelope(prev, duration, clamped))
    setDuration(clamped)
  }, [duration])

  const handleAddCarrier = useCallback(() => {
    if (carriers.length >= 4) return
    setCarriers((prev) => [...prev, { carrierFreq: 200, gainDb: -6 }])
  }, [carriers.length])

  const handleRemoveCarrier = useCallback((idx: number) => {
    if (carriers.length <= 1) return
    setCarriers((prev) => prev.filter((_, i) => i !== idx))
  }, [carriers.length])

  const handleCarrierChange = useCallback((idx: number, field: keyof CarrierLayer, value: number) => {
    setCarriers((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
  }, [])

  const handlePreview = useCallback(() => {
    if (isPreviewing) {
      preview.stop()
      setIsPreviewing(false)
    } else {
      const previewPreset: SessionPreset = {
        id: 'preview',
        name: 'Preview',
        description: '',
        category: 'custom',
        targetBand: deriveBand(envelope),
        duration,
        carriers,
        frequencyEnvelope: envelope,
        noiseType,
        noiseVolume: noiseVolume / 100,
        hasReturnPhase,
        isochronicAvailable: false,
        icon,
        color,
        ambientSound: 'none',
        ambientVolume: 0,
      }
      preview.play(previewPreset, 0.7)
      setIsPreviewing(true)
      setTimeout(() => setIsPreviewing(false), 5500)
    }
  }, [isPreviewing, preview, envelope, duration, carriers, noiseType, noiseVolume, hasReturnPhase, icon, color])

  const handleSave = useCallback(() => {
    if (!valid) return
    preview.stop()

    const targetBand = deriveBand(envelope)
    const minBeatFreq = envelope.reduce((min, p) => Math.min(min, p.beatFreq), Infinity)

    const preset: SessionPreset = {
      id: editingPreset?.id ?? `custom_${crypto.randomUUID()}`,
      name: name.trim(),
      description: description.trim(),
      category: 'custom',
      targetBand,
      duration,
      carriers,
      frequencyEnvelope: envelope,
      noiseType,
      noiseVolume: noiseVolume / 100,
      hasReturnPhase,
      isochronicAvailable: minBeatFreq >= 8,
      icon,
      color,
      ambientSound,
      ambientVolume: ambientVolume / 100,
    }

    onSave(preset)
  }, [valid, preview, editingPreset, name, description, duration, carriers, envelope, noiseType, noiseVolume, hasReturnPhase, icon, color, ambientSound, ambientVolume, onSave])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={isEditing ? 'Edit Session' : 'Create Session'}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={() => { preview.stop(); onClose() }}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg sm:rounded-3xl rounded-t-3xl glass animate-slide-up overflow-y-auto max-h-[90dvh]">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-6 pb-6 pt-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-100">
              {isEditing ? 'Edit Session' : 'Create Session'}
            </h2>
            <button
              onClick={() => { preview.stop(); onClose() }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors hover:bg-white/10"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {/* ── Name & Identity ── */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Session"
              maxLength={50}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this session..."
              maxLength={200}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-white/20 transition-colors resize-none"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">Icon</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    icon === emoji
                      ? 'bg-white/15 border border-white/20 scale-110'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-transparent scale-110' : 'hover:scale-110'
                  }`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* ── Duration ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-500">Duration</label>
              <span className="text-sm text-slate-300 font-medium">{Math.round(duration / 60)} min</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDurationChange(duration - DURATION_STEP)}
                disabled={duration <= MIN_DURATION}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 7h8" />
                </svg>
              </button>
              <input
                type="range"
                min={MIN_DURATION}
                max={MAX_DURATION}
                step={DURATION_STEP}
                value={duration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="flex-1"
                style={{
                  accentColor: color,
                }}
              />
              <button
                onClick={() => handleDurationChange(duration + DURATION_STEP)}
                disabled={duration >= MAX_DURATION}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 3v8M3 7h8" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Carrier Frequencies ── */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">Carrier Frequencies</label>
            <div className="space-y-2">
              {carriers.map((carrier, idx) => (
                <div key={idx} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">
                      Layer {idx + 1}
                    </span>
                    {carriers.length > 1 && (
                      <button
                        onClick={() => handleRemoveCarrier(idx)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                        aria-label="Remove carrier layer"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M4 4l8 8M12 4l-8 8" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Carrier Hz</span>
                        <span>{carrier.carrierFreq} Hz</span>
                      </div>
                      <input
                        type="range"
                        min={80}
                        max={500}
                        step={10}
                        value={carrier.carrierFreq}
                        onChange={(e) => handleCarrierChange(idx, 'carrierFreq', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Gain</span>
                        <span>{carrier.gainDb} dB</span>
                      </div>
                      <input
                        type="range"
                        min={-18}
                        max={0}
                        step={1}
                        value={carrier.gainDb}
                        onChange={(e) => handleCarrierChange(idx, 'gainDb', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {carriers.length < 4 && (
              <button
                onClick={handleAddCarrier}
                className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-white/10 text-xs text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all"
              >
                + Add Layer
              </button>
            )}
          </div>

          {/* ── Frequency Envelope ── */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">Frequency Envelope</label>
            <EnvelopeEditor
              envelope={envelope}
              duration={duration}
              color={color}
              onChange={setEnvelope}
            />
          </div>

          {/* ── Audio Settings ── */}
          <div>
            <label className="text-xs text-slate-500 block mb-2">Noise</label>
            <div className="flex gap-2 mb-3">
              {(['none', 'pink', 'brown'] as NoiseType[]).map((n) => (
                <button
                  key={n}
                  onClick={() => setNoiseType(n)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    noiseType === n
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'glass text-slate-400 border border-white/5 hover:border-white/15'
                  }`}
                >
                  {n === 'none' ? 'None' : n.charAt(0).toUpperCase() + n.slice(1)}
                </button>
              ))}
            </div>
            {noiseType !== 'none' && (
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Noise Volume</span>
                  <span>{noiseVolume}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={noiseVolume}
                  onChange={(e) => setNoiseVolume(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-2">Ambient Sound</label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setAmbientSound('none')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  ambientSound === 'none'
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'glass text-slate-400 border border-white/5 hover:border-white/15'
                }`}
              >
                None
              </button>
              {ambientSounds.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAmbientSound(s.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    ambientSound === s.id
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'glass text-slate-400 border border-white/5 hover:border-white/15'
                  }`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
            {ambientSound !== 'none' && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Ambient Volume</span>
                  <span>{ambientVolume}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* ── Options ── */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-300">Return phase</p>
              <p className="text-[10px] text-slate-500">Gradually return to waking frequency at end</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hasReturnPhase}
              aria-label="Return phase"
              onClick={() => setHasReturnPhase(!hasReturnPhase)}
              className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${hasReturnPhase ? 'bg-purple-500' : 'bg-white/10'}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${hasReturnPhase ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* ── Footer ── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePreview}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                isPreviewing
                  ? 'text-white border border-white/20'
                  : 'text-slate-300 border border-white/10 hover:border-white/20'
              }`}
              style={isPreviewing ? { background: `${color}15` } : undefined}
            >
              {isPreviewing ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                    <rect x="2" y="2" width="10" height="10" rx="1.5" />
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                    <path d="M3 1l10 6-10 6V1z" />
                  </svg>
                  Preview
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={!valid}
              className="flex-[2] py-3.5 rounded-2xl text-sm font-medium text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: valid ? `linear-gradient(135deg, ${color}, ${color}aa)` : undefined,
                boxShadow: valid ? `0 8px 32px ${color}30` : undefined,
              }}
            >
              {isEditing ? 'Save Changes' : 'Save Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
