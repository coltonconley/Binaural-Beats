import { useState, useEffect } from 'react'

interface Props {
  size: number
}

export function BreathingGuide({ size }: Props) {
  const [phase, setPhase] = useState<'in' | 'out'>('in')

  useEffect(() => {
    // 10s total cycle: 4.5s inhale, 5.5s exhale
    let timeout: ReturnType<typeof setTimeout>

    const cycle = () => {
      setPhase('in')
      timeout = setTimeout(() => {
        setPhase('out')
        timeout = setTimeout(cycle, 5500)
      }, 4500)
    }

    cycle()
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="rounded-full border border-white/15 transition-transform"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          transform: phase === 'in' ? 'scale(1)' : 'scale(0.85)',
          transitionDuration: phase === 'in' ? '4500ms' : '5500ms',
          transitionTimingFunction: 'ease-in-out',
        }}
      />
      <span className="absolute bottom-2 text-[9px] text-white/30 tracking-widest uppercase">
        {phase === 'in' ? 'Breathe in' : 'Breathe out'}
      </span>
    </div>
  )
}
