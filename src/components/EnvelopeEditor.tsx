import { useState, useCallback, useRef } from 'react'
import type { FrequencyPoint } from '../types'

interface Props {
  envelope: FrequencyPoint[]
  duration: number
  color: string
  onChange: (envelope: FrequencyPoint[]) => void
}

const MIN_FREQ = 0.5
const MAX_FREQ = 50
const MAX_POINTS = 10
const MIN_POINTS = 2
const SNAP_TIME = 15  // seconds
const SNAP_FREQ = 0.5 // Hz

// Brainwave bands for background coloring
const bands = [
  { label: 'Gamma', min: 30, max: 50, color: 'rgba(249, 115, 22, 0.06)' },
  { label: 'Beta', min: 13, max: 30, color: 'rgba(239, 68, 68, 0.06)' },
  { label: 'Alpha', min: 8, max: 13, color: 'rgba(59, 130, 246, 0.06)' },
  { label: 'Theta', min: 4, max: 8, color: 'rgba(168, 85, 247, 0.06)' },
  { label: 'Delta', min: 0.5, max: 4, color: 'rgba(99, 102, 241, 0.06)' },
]

const PADDING = { top: 20, right: 20, bottom: 32, left: 44 }
const SVG_WIDTH = 360
const SVG_HEIGHT = 220

function freqToY(freq: number): number {
  const plotH = SVG_HEIGHT - PADDING.top - PADDING.bottom
  const ratio = (freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ)
  return PADDING.top + plotH * (1 - ratio)
}

function yToFreq(y: number): number {
  const plotH = SVG_HEIGHT - PADDING.top - PADDING.bottom
  const ratio = 1 - (y - PADDING.top) / plotH
  const raw = MIN_FREQ + ratio * (MAX_FREQ - MIN_FREQ)
  return Math.round(raw / SNAP_FREQ) * SNAP_FREQ
}

function timeToX(time: number, duration: number): number {
  const plotW = SVG_WIDTH - PADDING.left - PADDING.right
  return PADDING.left + (time / duration) * plotW
}

function xToTime(x: number, duration: number): number {
  const plotW = SVG_WIDTH - PADDING.left - PADDING.right
  const ratio = (x - PADDING.left) / plotW
  const raw = ratio * duration
  return Math.round(raw / SNAP_TIME) * SNAP_TIME
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function EnvelopeEditor({ envelope, duration, color, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const lastTapRef = useRef<{ idx: number; time: number } | null>(null)

  const getSVGPoint = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const scaleX = SVG_WIDTH / rect.width
    const scaleY = SVG_HEIGHT / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const handlePointerDown = useCallback((idx: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Double-tap detection for deletion
    const now = Date.now()
    const last = lastTapRef.current
    if (last && last.idx === idx && now - last.time < 400) {
      // Double-tap → delete point
      if (envelope.length > MIN_POINTS && idx !== 0 && idx !== envelope.length - 1) {
        onChange(envelope.filter((_, i) => i !== idx))
      }
      lastTapRef.current = null
      return
    }
    lastTapRef.current = { idx, time: now }

    setDragging(idx)
  }, [envelope, onChange])

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (dragging === null) return
    e.preventDefault()

    const pt = getSVGPoint(e)
    if (!pt) return

    let newTime = xToTime(pt.x, duration)
    let newFreq = yToFreq(pt.y)

    // Clamp freq
    newFreq = Math.max(MIN_FREQ, Math.min(MAX_FREQ, newFreq))

    // First point locked to time=0, last locked to time=duration
    if (dragging === 0) {
      newTime = 0
    } else if (dragging === envelope.length - 1) {
      newTime = duration
    } else {
      // Keep between neighbors
      const prevTime = envelope[dragging - 1].time + SNAP_TIME
      const nextTime = envelope[dragging + 1].time - SNAP_TIME
      newTime = Math.max(prevTime, Math.min(nextTime, newTime))
    }

    const updated = envelope.map((p, i) =>
      i === dragging ? { time: newTime, beatFreq: newFreq } : p,
    )
    onChange(updated)

    setTooltip({
      x: timeToX(newTime, duration),
      y: freqToY(newFreq),
      text: `${formatTime(newTime)} / ${newFreq.toFixed(1)} Hz`,
    })
  }, [dragging, envelope, duration, getSVGPoint, onChange])

  const handlePointerUp = useCallback(() => {
    setDragging(null)
    setTooltip(null)
  }, [])

  const handleSVGClick = useCallback((e: React.MouseEvent) => {
    if (dragging !== null) return
    if (envelope.length >= MAX_POINTS) return

    const pt = getSVGPoint(e)
    if (!pt) return

    // Only add in plot area
    if (pt.x < PADDING.left || pt.x > SVG_WIDTH - PADDING.right) return
    if (pt.y < PADDING.top || pt.y > SVG_HEIGHT - PADDING.bottom) return

    const newTime = xToTime(pt.x, duration)
    const newFreq = Math.max(MIN_FREQ, Math.min(MAX_FREQ, yToFreq(pt.y)))

    // Don't add at exact same time as existing point
    if (envelope.some((p) => p.time === newTime)) return

    const updated = [...envelope, { time: newTime, beatFreq: newFreq }]
      .sort((a, b) => a.time - b.time)
    onChange(updated)
  }, [dragging, envelope, duration, getSVGPoint, onChange])

  // Build path
  const pathPoints = envelope.map((p) => ({
    x: timeToX(p.time, duration),
    y: freqToY(p.beatFreq),
  }))
  const linePath = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = linePath + ` L ${pathPoints[pathPoints.length - 1].x} ${freqToY(MIN_FREQ)} L ${pathPoints[0].x} ${freqToY(MIN_FREQ)} Z`

  // Y-axis tick values
  const yTicks = [1, 4, 8, 13, 30, 50]
  // X-axis ticks
  const xTickCount = Math.min(6, Math.floor(duration / 300))
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => Math.round((i / xTickCount) * duration))

  return (
    <div className="select-none touch-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)' }}
        onClick={handleSVGClick}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Band backgrounds */}
        {bands.map((band) => {
          const y1 = freqToY(Math.min(band.max, MAX_FREQ))
          const y2 = freqToY(Math.max(band.min, MIN_FREQ))
          return (
            <g key={band.label}>
              <rect
                x={PADDING.left}
                y={y1}
                width={SVG_WIDTH - PADDING.left - PADDING.right}
                height={y2 - y1}
                fill={band.color}
              />
              <text
                x={PADDING.left + 4}
                y={y1 + 11}
                fontSize="8"
                fill="rgba(148, 163, 184, 0.4)"
                fontFamily="sans-serif"
              >
                {band.label}
              </text>
            </g>
          )
        })}

        {/* Y-axis ticks */}
        {yTicks.map((freq) => {
          const y = freqToY(freq)
          return (
            <g key={freq}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={SVG_WIDTH - PADDING.right}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.5"
              />
              <text
                x={PADDING.left - 6}
                y={y + 3}
                fontSize="9"
                fill="rgba(148, 163, 184, 0.5)"
                textAnchor="end"
                fontFamily="sans-serif"
              >
                {freq}
              </text>
            </g>
          )
        })}

        {/* X-axis ticks */}
        {xTicks.map((time) => {
          const x = timeToX(time, duration)
          return (
            <g key={time}>
              <line
                x1={x}
                y1={PADDING.top}
                x2={x}
                y2={SVG_HEIGHT - PADDING.bottom}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.5"
              />
              <text
                x={x}
                y={SVG_HEIGHT - PADDING.bottom + 14}
                fontSize="9"
                fill="rgba(148, 163, 184, 0.5)"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {Math.round(time / 60)}m
              </text>
            </g>
          )
        })}

        {/* Y-axis label */}
        <text
          x={10}
          y={SVG_HEIGHT / 2}
          fontSize="9"
          fill="rgba(148, 163, 184, 0.4)"
          textAnchor="middle"
          fontFamily="sans-serif"
          transform={`rotate(-90, 10, ${SVG_HEIGHT / 2})`}
        >
          Hz
        </text>

        {/* Area fill */}
        <path d={areaPath} fill={`${color}10`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

        {/* Control points */}
        {pathPoints.map((p, i) => (
          <g key={i}>
            {/* Hit area (larger invisible circle for easier touch) */}
            <circle
              cx={p.x}
              cy={p.y}
              r={16}
              fill="transparent"
              className="cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handlePointerDown(i, e)}
              onTouchStart={(e) => handlePointerDown(i, e)}
            />
            {/* Pulse ring when dragging */}
            {dragging === i && (
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.4"
                className="animate-pulse-ring"
              />
            )}
            {/* Visible dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={dragging === i ? 6 : 4.5}
              fill={color}
              stroke="white"
              strokeWidth="1.5"
              className="transition-[r] duration-100 pointer-events-none"
            />
          </g>
        ))}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 42}
              y={tooltip.y - 28}
              width={84}
              height={18}
              rx={4}
              fill="rgba(0,0,0,0.8)"
            />
            <text
              x={tooltip.x}
              y={tooltip.y - 16}
              fontSize="9"
              fill="white"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {tooltip.text}
            </text>
          </g>
        )}
      </svg>
      <div className="flex justify-between mt-1.5 px-1">
        <span className="text-[10px] text-slate-600">
          Tap to add point{envelope.length >= MAX_POINTS ? ' (max reached)' : ''}
        </span>
        <span className="text-[10px] text-slate-600">
          Double-tap to remove
        </span>
      </div>
    </div>
  )
}
