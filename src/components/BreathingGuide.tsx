import { useState, useEffect, useRef } from 'react'

interface Props {
  size: number
}

export function BreathingGuide({ size }: Props) {
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const clearAll = () => {
      for (const t of timeoutsRef.current) clearTimeout(t)
      timeoutsRef.current = []
    }

    const cycle = () => {
      setPhase('in')
      const t1 = setTimeout(() => {
        setPhase('out')
        const t2 = setTimeout(cycle, 5500)
        timeoutsRef.current.push(t2)
      }, 4500)
      timeoutsRef.current.push(t1)
    }

    cycle()
    return clearAll
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
