import type { SessionPreset } from './types'
import { asgepMasterTrack } from './audio/tracks/asgepMasterTrack'

export const guidedPresets: SessionPreset[] = [
  asgepMasterTrack,

  // ── Track 1: Foundation (38 min) ─────────────────────────
  {
    id: 'guided-foundation',
    name: 'Track 1: Foundation',
    description: 'Full Gateway introduction with Energy Conversion Box, Resonant Tuning, REBAL, Affirmation, and progressive relaxation count to Focus 10 — "Mind Awake, Body Asleep."',
    category: 'guided',
    targetBand: 'theta',
    duration: 2280,
    carriers: [{ carrierFreq: 400, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 14 },
      { time: 45, beatFreq: 14 },
      { time: 120, beatFreq: 10 },
      { time: 615, beatFreq: 10 },
      { time: 900, beatFreq: 7.5 },
      { time: 1200, beatFreq: 5.5 },
      { time: 1320, beatFreq: 5 },
      { time: 1800, beatFreq: 5 },
      { time: 1920, beatFreq: 8 },
      { time: 2100, beatFreq: 12 },
      { time: 2280, beatFreq: 14 },
    ],
    noiseType: 'pink',
    noiseVolume: 0.25,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🌀',
    color: '#8b5cf6',
    ambientSound: 'ocean',
    ambientVolume: 0.18,
    guidanceScript: {
      phasedNoise: true,
      voiceVolume: 0.71,
      resonantTuning: {
        startTime: 75,
        endTime: 195,
        frequency: 136,
        gainDb: -6,
      },
      phases: [
        { name: 'Preparation', startTime: 0, endTime: 45 },
        { name: 'Energy Conversion Box', startTime: 45, endTime: 75 },
        { name: 'Resonant Tuning', startTime: 75, endTime: 195 },
        { name: 'REBAL', startTime: 195, endTime: 285 },
        { name: 'Affirmation', startTime: 285, endTime: 375 },
        { name: 'Progressive Relaxation', startTime: 375, endTime: 615 },
        { name: 'Descent to Focus 10', startTime: 615, endTime: 1320 },
        { name: 'Focus 10', startTime: 1320, endTime: 1800 },
        { name: 'Return', startTime: 1800, endTime: 2280 },
      ],
      voiceCues: [
        // Opening
        { time: 3, text: 'Welcome. Find a comfortable position, close your eyes, and take a deep breath.' },
        { time: 20, text: 'Allow yourself to relax. There is nothing to do but listen and follow along.' },

        // Energy Conversion Box
        { time: 45, text: 'Now, imagine a large, sturdy box. This is your Energy Conversion Box.', chime: true },
        { time: 55, text: 'Place into this box any worries, concerns, or distractions. Anything that might prevent you from having a full experience.' },
        { time: 68, text: 'Close the lid. These things will be there when you return. For now, they are safely stored.' },

        // Resonant Tuning
        { time: 78, text: 'Resonant Tuning. Breathe deeply in through your nose.', chime: true },
        { time: 90, text: 'And as you exhale, hum along with this tone. Feel the vibration fill your body.' },
        { time: 120, text: 'Breathe in again, deeply. And hum as you exhale. Let the vibration expand.' },
        { time: 150, text: 'Once more. Deep breath in. And release with a long, steady hum.' },
        { time: 180, text: 'Feel the resonance throughout your entire body. Let it settle.' },

        // REBAL
        { time: 198, text: 'Now, create your Resonant Energy Balloon. Imagine a bright energy flowing from above your head.', chime: true },
        { time: 215, text: 'This energy flows down around you, forming a protective, vibrant cocoon.' },
        { time: 230, text: 'It surrounds you completely — above, below, all around. You are safe within this field.' },
        { time: 250, text: 'This is your REBAL. It protects and supports you throughout your experience.' },

        // Affirmation
        { time: 288, text: 'Repeat the affirmation silently: I am more than my physical body.', chime: true },
        { time: 305, text: 'Because I am more than physical matter, I can perceive that which is greater than the physical world.' },
        { time: 325, text: 'I deeply desire to expand, to experience, to know, to understand, to control, to use.' },
        { time: 345, text: 'Such greater energies and energy systems as may be beneficial and constructive to me and to those who follow me.' },
        { time: 365, text: 'I deeply desire the help and cooperation of those beings whose wisdom and development are equal to or greater than my own.' },

        // Progressive Relaxation
        { time: 378, text: 'Now, let us begin the relaxation process. Focus on your feet and toes. Let them relax completely.', chime: true },
        { time: 400, text: 'Feel the relaxation moving up through your ankles, your calves, your knees.' },
        { time: 420, text: 'Your thighs and hips are becoming deeply relaxed. Heavy and comfortable.' },
        { time: 440, text: 'The relaxation flows through your abdomen, your lower back. Releasing all tension.' },
        { time: 460, text: 'Your chest rises and falls easily. Your shoulders drop. Your arms grow heavy.' },
        { time: 480, text: 'Your hands and fingers are completely relaxed. Warm and heavy.' },
        { time: 500, text: 'Your neck releases. Your jaw unclenches. Your face softens completely.' },
        { time: 520, text: 'Your entire body is now deeply, profoundly relaxed.' },

        // Descent counting
        { time: 618, text: 'We will now begin the descent to Focus 10. I will count from one to ten.', chime: true },
        { time: 640, text: 'One.' },
        { time: 670, text: 'Two. Deeper and more relaxed.' },
        { time: 710, text: 'Three. Your body is becoming very distant.' },
        { time: 760, text: 'Four. Deeper still.' },
        { time: 810, text: 'Five. Halfway there. Your body is far away.' },
        { time: 870, text: 'Six. Going deeper.' },
        { time: 930, text: 'Seven. Your body is asleep, but your mind remains alert.' },
        { time: 1000, text: 'Eight. Almost there.' },
        { time: 1100, text: 'Nine. Very deep now.' },
        { time: 1200, text: 'Ten. You are now in Focus 10. Mind awake, body asleep.' },

        // Focus 10 exploration
        { time: 1325, text: 'Focus 10. Mind awake, body asleep. Rest here. Explore this state.', chime: true },
        { time: 1500, text: 'Simply be present in this space. There is no effort required.' },
        { time: 1700, text: 'In a few moments, we will begin the return journey.' },

        // Return
        { time: 1803, text: 'It is time to return. I will count from ten back to one.', chime: true },
        { time: 1830, text: 'Ten. Nine. Begin to feel your body again.' },
        { time: 1870, text: 'Eight. Seven. Becoming more aware.' },
        { time: 1920, text: 'Six. Five. Feeling energy returning.' },
        { time: 1970, text: 'Four. Three. More alert and refreshed.' },
        { time: 2020, text: 'Two. Almost fully awake. Feeling wonderful.' },
        { time: 2060, text: 'One. Eyes open, fully awake, refreshed, and better than before.' },

        // Health affirmation
        { time: 2120, text: 'Remember: you are more than your physical body. Carry this knowing with you.' },
        { time: 2200, text: 'Take a moment before moving. When you are ready, gently stretch and return to full waking awareness.' },
      ],
    },
  },

  // ── Track 2: Deepening (35 min) ──────────────────────────
  {
    id: 'guided-deepening',
    name: 'Track 2: Deepening',
    description: 'Abbreviated preparation with rapid Focus 10 entry and 18 minutes of uninterrupted freeflow time for deepening your practice.',
    category: 'guided',
    targetBand: 'theta',
    duration: 2100,
    carriers: [{ carrierFreq: 400, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 14 },
      { time: 120, beatFreq: 10 },
      { time: 300, beatFreq: 10 },
      { time: 420, beatFreq: 7 },
      { time: 540, beatFreq: 5 },
      { time: 1620, beatFreq: 5 },
      { time: 1800, beatFreq: 8 },
      { time: 1980, beatFreq: 12 },
      { time: 2100, beatFreq: 14 },
    ],
    noiseType: 'pink',
    noiseVolume: 0.25,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🌀',
    color: '#7c3aed',
    ambientSound: 'ocean',
    ambientVolume: 0.18,
    guidanceScript: {
      phasedNoise: true,
      voiceVolume: 0.71,
      resonantTuning: {
        startTime: 45,
        endTime: 120,
        frequency: 136,
        gainDb: -6,
      },
      phases: [
        { name: 'Preparation', startTime: 0, endTime: 120 },
        { name: 'Resonant Tuning', startTime: 45, endTime: 120 },
        { name: 'Descent to Focus 10', startTime: 300, endTime: 540 },
        { name: 'Focus 10', startTime: 540, endTime: 1620 },
        { name: 'Return', startTime: 1620, endTime: 2100 },
      ],
      voiceCues: [
        { time: 3, text: 'Welcome back. Close your eyes and settle into your comfortable position.' },
        { time: 18, text: 'Quickly place any concerns into your Energy Conversion Box. Close the lid.' },
        { time: 35, text: 'Create your REBAL around you. Feel its protective presence.' },
        { time: 48, text: 'Resonant Tuning. Breathe deeply and hum with the tone.', chime: true },
        { time: 80, text: 'Again. Deep breath in, and hum as you exhale.' },
        { time: 110, text: 'Good. Now repeat the Affirmation silently to yourself.' },

        // Rapid descent
        { time: 303, text: 'Rapid descent to Focus 10. One, two, three, going deeper.', chime: true },
        { time: 340, text: 'Four, five, six, your body is falling away.' },
        { time: 380, text: 'Seven, eight, nine.' },
        { time: 420, text: 'Ten. Focus 10. Mind awake, body asleep.' },

        // Freeflow
        { time: 545, text: 'You now have eighteen minutes of uninterrupted time in Focus 10. Use this time freely.', chime: true },
        { time: 900, text: 'You are doing well. Continue your exploration.', chime: true },

        // 2-minute warning
        { time: 1500, chimeOnly: true, text: '', chime: true },

        // Return
        { time: 1623, text: 'It is time to return. Ten, nine, eight, feeling your body.', chime: true },
        { time: 1700, text: 'Seven, six, five, energy returning.' },
        { time: 1800, text: 'Four, three, becoming alert.' },
        { time: 1900, text: 'Two, one. Fully awake, refreshed, and better than before.' },
        { time: 2000, text: 'Take a moment before moving. Well done.' },
      ],
    },
  },

  // ── Track 3: Expansion (42 min) ──────────────────────────
  {
    id: 'guided-expansion',
    name: 'Track 3: Expansion',
    description: 'Journey from Focus 10 into Focus 12 — expanded awareness. Experience the shift from body-asleep to a wider field of perception.',
    category: 'guided',
    targetBand: 'theta',
    duration: 2520,
    carriers: [{ carrierFreq: 400, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 14 },
      { time: 120, beatFreq: 10 },
      { time: 420, beatFreq: 10 },
      { time: 540, beatFreq: 7 },
      { time: 660, beatFreq: 5 },
      { time: 840, beatFreq: 5 },
      { time: 1080, beatFreq: 4 },
      { time: 1980, beatFreq: 4 },
      { time: 2100, beatFreq: 5 },
      { time: 2220, beatFreq: 8 },
      { time: 2400, beatFreq: 14 },
      { time: 2520, beatFreq: 14 },
    ],
    noiseType: 'pink',
    noiseVolume: 0.25,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🌀',
    color: '#6d28d9',
    ambientSound: 'stream',
    ambientVolume: 0.18,
    guidanceScript: {
      phasedNoise: true,
      voiceVolume: 0.71,
      resonantTuning: {
        startTime: 45,
        endTime: 120,
        frequency: 136,
        gainDb: -6,
      },
      phases: [
        { name: 'Preparation', startTime: 0, endTime: 120 },
        { name: 'Resonant Tuning', startTime: 45, endTime: 120 },
        { name: 'Descent to Focus 10', startTime: 420, endTime: 660 },
        { name: 'Focus 10', startTime: 660, endTime: 840 },
        { name: 'Transition to Focus 12', startTime: 840, endTime: 1080 },
        { name: 'Focus 12', startTime: 1080, endTime: 1980 },
        { name: 'Return', startTime: 1980, endTime: 2520 },
      ],
      voiceCues: [
        { time: 3, text: 'Welcome. Close your eyes and settle in. Place concerns in your Energy Conversion Box.' },
        { time: 25, text: 'Create your REBAL. Feel it surround you with protective energy.' },
        { time: 48, text: 'Resonant Tuning. Deep breath in, and hum with the tone.', chime: true },
        { time: 80, text: 'Again. Breathe deeply. Hum as you exhale.' },
        { time: 110, text: 'Repeat the Affirmation silently.' },

        // Rapid Focus 10
        { time: 423, text: 'Rapid descent to Focus 10. One through five, going deep.', chime: true },
        { time: 470, text: 'Six, seven, eight, nine.' },
        { time: 520, text: 'Ten. Focus 10. Mind awake, body asleep.' },

        // Stabilize Focus 10
        { time: 665, text: 'Rest in Focus 10. Feel the familiar state. Your body is distant.', chime: true },

        // Transition to Focus 12
        { time: 843, text: 'Now we move beyond Focus 10. I will count from ten to twelve.', chime: true },
        { time: 870, text: 'Ten. Eleven. Feel your awareness expanding beyond your body.' },
        { time: 940, text: 'Twelve. Focus 12. Expanded awareness. Your perception widens in all directions.' },

        // Focus 12 exploration
        { time: 1085, text: 'Focus 12. You are in a state of expanded awareness. Explore freely.', chime: true },
        { time: 1400, text: 'Notice what you perceive. There is no right or wrong experience.' },
        { time: 1700, text: 'Continue your exploration. The return will begin soon.' },

        // Return
        { time: 1983, text: 'Time to return. Moving back to Focus 10.', chime: true },
        { time: 2050, text: 'Focus 10. Now counting back. Ten, nine, eight.' },
        { time: 2120, text: 'Seven, six, five. Feeling your body again.' },
        { time: 2200, text: 'Four, three, two.' },
        { time: 2300, text: 'One. Fully awake, alert, refreshed, and better than before.' },
        { time: 2420, text: 'Take your time. When ready, gently open your eyes.' },
      ],
    },
  },

  // ── Track 4: Liberation (45 min) ─────────────────────────
  {
    id: 'guided-liberation',
    name: 'Track 4: Liberation',
    description: 'Journey through Focus 10 and 12 into Focus 15 — the "No-Time" state. Release from the constraints of time and space.',
    category: 'guided',
    targetBand: 'delta',
    duration: 2700,
    carriers: [{ carrierFreq: 400, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 14 },
      { time: 120, beatFreq: 10 },
      { time: 360, beatFreq: 10 },
      { time: 480, beatFreq: 7 },
      { time: 540, beatFreq: 5 },
      { time: 660, beatFreq: 5 },
      { time: 840, beatFreq: 4 },
      { time: 1200, beatFreq: 2.5 },
      { time: 2100, beatFreq: 2.5 },
      { time: 2280, beatFreq: 4 },
      { time: 2400, beatFreq: 5 },
      { time: 2520, beatFreq: 10 },
      { time: 2700, beatFreq: 14 },
    ],
    noiseType: 'pink',
    noiseVolume: 0.25,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🌀',
    color: '#5b21b6',
    ambientSound: 'none',
    ambientVolume: 0,
    guidanceScript: {
      phasedNoise: true,
      voiceVolume: 0.71,
      resonantTuning: {
        startTime: 40,
        endTime: 110,
        frequency: 136,
        gainDb: -6,
      },
      phases: [
        { name: 'Preparation', startTime: 0, endTime: 120 },
        { name: 'Resonant Tuning', startTime: 40, endTime: 110 },
        { name: 'Descent to Focus 10', startTime: 360, endTime: 540 },
        { name: 'Focus 10', startTime: 540, endTime: 660 },
        { name: 'Focus 12', startTime: 660, endTime: 840 },
        { name: 'Transition to Focus 15', startTime: 840, endTime: 1200 },
        { name: 'Focus 15', startTime: 1200, endTime: 2100 },
        { name: 'Return', startTime: 2100, endTime: 2700 },
      ],
      voiceCues: [
        { time: 3, text: 'Welcome. Settle in quickly. Energy Conversion Box. REBAL.' },
        { time: 43, text: 'Resonant Tuning. Breathe and hum.', chime: true },
        { time: 75, text: 'Once more. Deep breath, and hum.' },
        { time: 105, text: 'Affirmation. Silently.' },

        // Rapid Focus 10
        { time: 363, text: 'Rapid descent. One through ten.', chime: true },
        { time: 400, text: 'Focus 10. Mind awake, body asleep.' },

        // Quick Focus 12
        { time: 545, text: 'Moving to Focus 12. Ten, eleven, twelve. Expanded awareness.', chime: true },

        // Transition to Focus 15
        { time: 663, text: 'Focus 12. Stable. Now we go further.', chime: true },
        { time: 843, text: 'I will count from twelve to fifteen. Each number takes you deeper into a state beyond time.', chime: true },
        { time: 880, text: 'Twelve. Thirteen. Feel time beginning to dissolve.' },
        { time: 950, text: 'Fourteen. The sense of time is fading.' },
        { time: 1050, text: 'Fifteen. Focus 15. No-Time. You exist outside of time.' },

        // Focus 15 exploration
        { time: 1205, text: 'Focus 15. The No-Time state. There is no past, no future. Only this infinite present.', chime: true },
        { time: 1500, text: 'Rest in timelessness. Let any impressions come to you naturally.' },
        { time: 1900, text: 'The return will begin shortly.' },

        // Staged return
        { time: 2103, text: 'Time to return. Moving back through Focus 12.', chime: true },
        { time: 2200, text: 'Focus 12. Now back to Focus 10.' },
        { time: 2300, text: 'Focus 10. Counting back. Ten, nine, eight, seven.' },
        { time: 2400, text: 'Six, five, four, three.' },
        { time: 2500, text: 'Two, one. Fully awake, refreshed, and better than before.' },
        { time: 2600, text: 'Take your time. Gently return to full waking awareness.' },
      ],
    },
  },

  // ── Track 5: Bridging (50 min) ───────────────────────────
  {
    id: 'guided-bridging',
    name: 'Track 5: Bridging',
    description: 'Rapid transit through all focus levels to Focus 21 — "The Bridge." The deepest guided state, at the edge of conscious perception.',
    category: 'guided',
    targetBand: 'delta',
    duration: 3000,
    carriers: [{ carrierFreq: 400, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 14 },
      { time: 120, beatFreq: 10 },
      { time: 300, beatFreq: 10 },
      { time: 420, beatFreq: 7 },
      { time: 480, beatFreq: 5 },
      { time: 600, beatFreq: 4 },
      { time: 780, beatFreq: 2.5 },
      { time: 900, beatFreq: 2.5 },
      { time: 1320, beatFreq: 1.5 },
      { time: 2400, beatFreq: 1.5 },
      { time: 2580, beatFreq: 2.5 },
      { time: 2700, beatFreq: 4 },
      { time: 2820, beatFreq: 5 },
      { time: 2940, beatFreq: 10 },
      { time: 3000, beatFreq: 14 },
    ],
    noiseType: 'pink',
    noiseVolume: 0.25,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🌀',
    color: '#4c1d95',
    ambientSound: 'none',
    ambientVolume: 0,
    guidanceScript: {
      phasedNoise: true,
      voiceVolume: 0.71,
      resonantTuning: {
        startTime: 35,
        endTime: 100,
        frequency: 136,
        gainDb: -6,
      },
      phases: [
        { name: 'Preparation', startTime: 0, endTime: 120 },
        { name: 'Resonant Tuning', startTime: 35, endTime: 100 },
        { name: 'Descent to Focus 10', startTime: 300, endTime: 480 },
        { name: 'Focus 10', startTime: 480, endTime: 600 },
        { name: 'Focus 12', startTime: 600, endTime: 780 },
        { name: 'Focus 15', startTime: 780, endTime: 900 },
        { name: 'Transition to Focus 21', startTime: 900, endTime: 1320 },
        { name: 'Focus 21', startTime: 1320, endTime: 2400 },
        { name: 'Return', startTime: 2400, endTime: 3000 },
      ],
      voiceCues: [
        { time: 3, text: 'Welcome. Quickly prepare. Energy Conversion Box. REBAL.' },
        { time: 38, text: 'Resonant Tuning. Breathe and hum.', chime: true },
        { time: 70, text: 'Once more. And Affirmation, silently.' },

        // Rapid transit
        { time: 303, text: 'Rapid descent. One through ten. Focus 10.', chime: true },
        { time: 370, text: 'Focus 10. Moving quickly. Ten, eleven, twelve. Focus 12.' },
        { time: 430, text: 'Focus 12. Twelve, thirteen, fourteen, fifteen. Focus 15.' },

        // Stable Focus 15
        { time: 483, text: 'Focus 15. No-Time. Rest here briefly.', chime: true },

        // Transition to Focus 21
        { time: 603, text: 'Now we go beyond. I will count from fifteen to twenty-one.', chime: true },
        { time: 783, text: 'Fifteen. Sixteen. Moving into unknown territory.', chime: true },
        { time: 850, text: 'Seventeen. Eighteen. The bridge is forming.' },
        { time: 950, text: 'Nineteen. Twenty. You are crossing the bridge.' },
        { time: 1100, text: 'Twenty-one. Focus 21. The Bridge. You are at the edge of perception.' },

        // Focus 21 exploration
        { time: 1325, text: 'Focus 21. Remain a gentle observer. Let whatever comes, come.', chime: true },
        { time: 1800, text: 'Continue in this state. You are safe within your REBAL.' },
        { time: 2200, text: 'The return will begin shortly.' },

        // Staged return
        { time: 2403, text: 'Time to return. Coming back through Focus 15.', chime: true },
        { time: 2500, text: 'Focus 15. Now Focus 12.' },
        { time: 2580, text: 'Focus 12. Focus 10.' },
        { time: 2700, text: 'Counting back. Ten, nine, eight, seven, six.' },
        { time: 2800, text: 'Five, four, three, two, one.' },
        { time: 2870, text: 'Fully awake. Refreshed. Better than before.' },
        { time: 2930, text: 'Take all the time you need. You have traveled far.' },
      ],
    },
  },

  // ── Track 6: Integration (55 min) ────────────────────────
  {
    id: 'guided-integration',
    name: 'Track 6: Integration',
    description: 'Self-directed full-spectrum freeflow. Minimal guidance — you choose your own depth and pace through all focus levels.',
    category: 'guided',
    targetBand: 'delta',
    duration: 3300,
    carriers: [{ carrierFreq: 400, gainDb: 0 }],
    frequencyEnvelope: [
      { time: 0, beatFreq: 14 },
      { time: 120, beatFreq: 10 },
      { time: 240, beatFreq: 10 },
      { time: 420, beatFreq: 5 },
      { time: 720, beatFreq: 5 },
      { time: 1020, beatFreq: 4 },
      { time: 1320, beatFreq: 4 },
      { time: 1620, beatFreq: 2.5 },
      { time: 1920, beatFreq: 2.5 },
      { time: 2220, beatFreq: 1.5 },
      { time: 2520, beatFreq: 1.5 },
      { time: 2820, beatFreq: 2.5 },
      { time: 2940, beatFreq: 5 },
      { time: 3060, beatFreq: 8 },
      { time: 3180, beatFreq: 14 },
      { time: 3300, beatFreq: 14 },
    ],
    noiseType: 'pink',
    noiseVolume: 0.25,
    hasReturnPhase: true,
    isochronicAvailable: false,
    icon: '🌀',
    color: '#3b0764',
    ambientSound: 'ocean',
    ambientVolume: 0.15,
    guidanceScript: {
      phasedNoise: true,
      voiceVolume: 0.71,
      phases: [
        { name: 'Self-Guided Preparation', startTime: 0, endTime: 240 },
        { name: 'Focus 10', startTime: 420, endTime: 720 },
        { name: 'Focus 12', startTime: 1020, endTime: 1320 },
        { name: 'Focus 15', startTime: 1620, endTime: 1920 },
        { name: 'Focus 21', startTime: 2220, endTime: 2520 },
        { name: 'Return', startTime: 2820, endTime: 3300 },
      ],
      voiceCues: [
        { time: 3, text: 'This session is yours to direct. Prepare yourself in your own way. Energy Conversion Box. REBAL. Affirmation.' },
        { time: 30, text: 'Take your time with preparation. The frequencies will guide your descent.' },

        // Phase markers with chimes
        { time: 243, text: 'Begin your descent when ready. The tones are moving toward Focus 10.', chime: true },
        { time: 423, text: 'Focus 10 zone.', chimeOnly: true, chime: true },
        { time: 723, text: 'Transitioning toward Focus 12.', chime: true },
        { time: 1023, text: 'Focus 12 zone.', chimeOnly: true, chime: true },
        { time: 1323, text: 'Transitioning toward Focus 15.', chime: true },
        { time: 1623, text: 'Focus 15 zone.', chimeOnly: true, chime: true },
        { time: 1923, text: 'Transitioning toward Focus 21.', chime: true },
        { time: 2223, text: 'Focus 21 zone.', chimeOnly: true, chime: true },

        // Return
        { time: 2523, text: 'The return is beginning. Allow yourself to come back gradually.', chime: true },
        { time: 2823, text: 'Counting back. Ten, nine, eight, seven, six, five, four, three, two, one.', chime: true },
        { time: 2950, text: 'Fully awake. Refreshed. Carrying the experience with you.' },
        { time: 3100, text: 'Well done. Take all the time you need.' },
      ],
    },
  },
]
