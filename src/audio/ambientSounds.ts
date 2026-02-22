import type { AmbientSoundType } from '../types'

export interface AmbientSoundMeta {
  id: AmbientSoundType
  label: string
  icon: string
  filename: string
  description: string
}

export const ambientSounds: AmbientSoundMeta[] = [
  {
    id: 'rain',
    label: 'Rain',
    icon: '🌧',
    filename: 'rain.wav',
    description: 'Gentle rainfall',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    icon: '🌊',
    filename: 'ocean.wav',
    description: 'Ocean waves',
  },
  {
    id: 'forest',
    label: 'Forest',
    icon: '🌲',
    filename: 'forest.wav',
    description: 'Forest ambience with birdsong',
  },
  {
    id: 'fire',
    label: 'Fire',
    icon: '🔥',
    filename: 'fire.wav',
    description: 'Crackling campfire',
  },
  {
    id: 'wind',
    label: 'Wind',
    icon: '💨',
    filename: 'wind.wav',
    description: 'Soft wind through trees',
  },
  {
    id: 'stream',
    label: 'Stream',
    icon: '🏞',
    filename: 'stream.wav',
    description: 'Babbling brook',
  },
  {
    id: 'rain-tin-roof',
    label: 'Tin Roof',
    icon: '🏠',
    filename: 'rain-tin-roof.wav',
    description: 'Rain on a tin roof',
  },
  {
    id: 'rain-on-leaves',
    label: 'Leaves',
    icon: '🍃',
    filename: 'rain-on-leaves.wav',
    description: 'Rain pattering on leaves',
  },
]
