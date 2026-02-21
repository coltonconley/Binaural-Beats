import { useState } from 'react'

interface Props {
  onComplete: () => void
}

const slides = [
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-6">
        <path
          d="M8 32C8 32 16 16 32 16C48 16 56 32 56 32C56 32 48 48 32 48C16 48 8 32 8 32Z"
          stroke="url(#wave-grad)" strokeWidth="2" fill="none"
        />
        <path
          d="M4 32C4 32 12 20 24 24C36 28 32 36 44 32C56 28 60 32 60 32"
          stroke="url(#wave-grad)" strokeWidth="2" fill="none" opacity="0.5"
        />
        <defs>
          <linearGradient id="wave-grad" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#a855f7" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
    ),
    title: 'Binaural Beats',
    body: 'Precision-generated audio tones designed to support relaxation, focus, and meditation through auditory brainwave stimulation.',
    buttonLabel: 'Next',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-6">
        <path
          d="M20 16C20 16 12 16 12 24V40C12 48 20 48 20 48"
          stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" fill="none"
        />
        <path
          d="M44 16C44 16 52 16 52 24V40C52 48 44 48 44 48"
          stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" fill="none"
        />
        <rect x="18" y="14" width="4" height="36" rx="2" fill="#e2e8f0" />
        <rect x="42" y="14" width="4" height="36" rx="2" fill="#e2e8f0" />
        <line x1="22" y1="32" x2="42" y2="32" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    ),
    title: 'Stereo Headphones Required',
    body: 'Binaural beats work by sending different frequencies to each ear. Wired headphones provide the best experience. Bluetooth may reduce effectiveness due to audio compression.',
    buttonLabel: 'Next',
  },
  {
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-6">
        <path
          d="M32 8L38 20H58L42 30L48 44L32 34L16 44L22 30L6 20H26L32 8Z"
          stroke="#f59e0b" strokeWidth="2" fill="none"
        />
        <circle cx="32" cy="32" r="24" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
      </svg>
    ),
    title: 'Important Safety Information',
    body: '',
    buttonLabel: 'I Understand',
    safetyItems: [
      'Do not use if you have epilepsy or a seizure disorder — rhythmic auditory stimulation may lower seizure thresholds.',
      'This is not a medical device. It does not diagnose, treat, cure, or prevent any condition.',
      'Recommended for ages 12 and older.',
      'Consult a healthcare provider if you have a psychiatric condition.',
      'Do not use while driving or operating machinery.',
      'Listen at a comfortable, moderate volume.',
    ],
  },
]

export function Onboarding({ onComplete }: Props) {
  const [slideIndex, setSlideIndex] = useState(0)
  const slide = slides[slideIndex]

  const handleNext = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1)
    } else {
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-8" style={{ background: 'var(--color-bg-deep)' }}>
      <div key={slideIndex} className="animate-fade-in max-w-sm text-center">
        {slide.icon}

        <h1 className="text-2xl font-light tracking-tight text-slate-100 mb-4">
          {slide.title}
        </h1>

        {slide.body && (
          <p className="text-sm leading-relaxed text-slate-400 mb-8">
            {slide.body}
          </p>
        )}

        {slide.safetyItems && (
          <ul className="text-left text-xs leading-relaxed text-slate-400 space-y-3 mb-8">
            {slide.safetyItems.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-400 mt-0.5 shrink-0">!</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleNext}
          className={`w-full py-3.5 rounded-2xl text-sm font-medium transition-all ${
            slide.buttonLabel === 'I Understand'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20'
              : 'border border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
          }`}
        >
          {slide.buttonLabel}
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex gap-2 mt-12">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === slideIndex ? 'bg-white w-4' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
