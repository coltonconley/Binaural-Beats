import { useState, useEffect, useRef } from 'react'
import { useHaptics } from '../hooks/useHaptics'

interface Props {
  size: number
  hapticEnabled?: boolean
}

export function BreathingGuide({ size, hapticEnabled = false }: Props) {
  const [phase, setPhase] = useState<'in' | 'out'>('out')
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const haptics = useHaptics()

  useEffect(() => {
    const clearAll = () => {
      for (const t of timeoutsRef.current) clearTimeout(t)
      timeoutsRef.current = []
    }

    const cycle = () => {
      setPhase('in')
      if (hapticEnabled && haptics.isSupported) {
        haptics.pulse(50)
      }
      const t1 = setTimeout(() => {
        setPhase('out')
        if (hapticEnabled && haptics.isSupported) {
          haptics.pattern([30, 50, 30])
        }
        const t2 = setTimeout(cycle, 5500)
        timeoutsRef.current.push(t2)
      }, 4500)
      timeoutsRef.current.push(t1)
    }

    cycle()
    return clearAll
  }, [hapticEnabled, haptics])

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
