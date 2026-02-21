import { useRef, useEffect, useCallback } from 'react'

interface Props {
  getAnalyser: () => AnalyserNode | null
  color: string
  isPlaying: boolean
}

export function Visualizer({ getAnalyser, color, isPlaying }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = getAnalyser()
    if (!canvas || !analyser) {
      rafRef.current = requestAnimationFrame(draw)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteTimeDomainData(dataArray)

    const w = canvas.width
    const h = canvas.height
    const centerY = h / 2

    ctx.clearRect(0, 0, w, h)

    // Draw waveform as a subtle curved line
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.15
    ctx.lineWidth = 1.5

    const sliceWidth = w / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = v * centerY

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      x += sliceWidth
    }

    ctx.stroke()
    ctx.globalAlpha = 1

    rafRef.current = requestAnimationFrame(draw)
  }, [getAnalyser, color])

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(draw)
    }
    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw, isPlaying])

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ borderRadius: '50%' }}
    />
  )
}
