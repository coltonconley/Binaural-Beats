import type { FrequencyPoint } from '../types'

interface Props {
  envelope: FrequencyPoint[]
  duration: number
  color: string
  width?: number
  height?: number
}

export function FrequencySparkline({ envelope, duration, color, width = 240, height = 60 }: Props) {
  if (envelope.length < 2) return null

  const padding = 4
  const chartW = width - padding * 2
  const chartH = height - padding * 2

  // Find frequency range
  const freqs = envelope.map((p) => p.beatFreq)
  const maxFreq = Math.max(...freqs)
  const minFreq = Math.min(...freqs)
  const range = maxFreq - minFreq || 1

  // Build SVG path
  const points = envelope.map((p) => ({
    x: padding + (p.time / duration) * chartW,
    y: padding + (1 - (p.beatFreq - minFreq) / range) * chartH,
  }))

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  // Area fill path
  const areaPath = `${pathData} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ maxWidth: width }}
    >
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={color} fillOpacity="0.08" />

      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Endpoint dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} opacity={i === 0 || i === points.length - 1 ? 0.8 : 0.3} />
      ))}

      {/* Labels */}
      <text x={padding} y={height - 1} fontSize="8" fill="currentColor" opacity="0.3">
        0 min
      </text>
      <text x={width - padding} y={height - 1} fontSize="8" fill="currentColor" opacity="0.3" textAnchor="end">
        {Math.round(duration / 60)} min
      </text>
    </svg>
  )
}
