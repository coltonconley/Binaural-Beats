/**
 * ASGEP Master Track — Voice Script
 *
 * Verbatim narration cues anchored to absolute timestamps (seconds from session start).
 * Monroe-sourced phrasing with exact Gateway Affirmation text.
 *
 * Silence windows (no voice cues):
 *   3:00–6:30 → Resonant Tuning exercise
 *   16:00–24:00 → Focus 10 freeflow hold
 *   27:00–33:00 → Focus 12 freeflow hold
 *   36:30–43:00 → Focus 15 void hold
 *   44:00–49:30 → Focus 21 erratic-SAM hold
 */
import type { VoiceCue } from '../../types'

export const asgepVoiceScript: VoiceCue[] = [

  // ── Phase 1: Induction (0:00–15:00) ─────────────────────────────────────

  // Opening
  {
    time: 4,
    text: 'Welcome. Find a comfortable position, close your eyes, and allow your body to settle completely.',
  },
  {
    time: 22,
    text: 'There is nothing to do but listen and follow along. Let any thoughts pass like clouds — gently and without effort.',
  },

  // Energy Conversion Box
  {
    time: 122,
    text: 'Now, imagine a large and sturdy box before you. This is your Energy Conversion Box.',
    chime: true,
  },
  {
    time: 138,
    text: 'Place into this box any worries, concerns, or distractions — anything that might prevent you from having a full and complete experience.',
  },
  {
    time: 160,
    text: 'Close the lid firmly. These things will be here when you return. For now, they are safely stored.',
  },

  // REBAL
  {
    time: 198,
    text: 'Now create your Resonant Energy Balloon. Visualize a bright, living energy flowing down from above your head.',
    chime: true,
  },
  {
    time: 218,
    text: 'This energy flows outward, forming a protective cocoon of vibrating light — above you, below you, all around you.',
  },
  {
    time: 240,
    text: 'You are completely enclosed in this field. It is your REBAL. It protects you and supports you throughout everything that follows.',
  },

  // Gateway Affirmation (verbatim)
  {
    time: 272,
    text: 'Now, repeat the affirmation silently with me.',
    chime: true,
  },
  {
    time: 285,
    text: 'I am more than my physical body.',
  },
  {
    time: 300,
    text: 'Because I am more than physical matter, I can perceive that which is greater than the physical world.',
  },
  {
    time: 320,
    text: 'I deeply desire to Expand, to Experience, to Know, to Understand, to Control, to Use.',
  },
  {
    time: 340,
    text: 'Such greater energies and energy systems as may be beneficial and constructive to me and to those who follow me.',
  },
  {
    time: 362,
    text: 'Also, I deeply desire the help and cooperation of those whose wisdom, development, and experience are equal to or greater than my own.',
  },

  // Resonant Tuning — intro
  {
    time: 390,
    text: 'Resonant Tuning. Breathe slowly and deeply through your nose.',
    chime: true,
  },
  {
    time: 405,
    text: 'As you exhale, hum aloud with the tone you hear. Feel the vibration spread through your chest, your throat, your entire body.',
  },
  {
    time: 440,
    text: 'Breathe deeply again. And hum as you exhale. Let the resonance expand.',
  },
  {
    time: 480,
    text: 'Once more. Deep breath in — and release with a long, steady hum. Feel the vibration reaching every part of you.',
  },

  // Alpha entrainment explanation
  {
    time: 530,
    text: 'Good. The tones in your ears are now guiding your mind into Alpha — eight cycles per second. A calm, receptive awareness.',
    chime: true,
  },
  {
    time: 555,
    text: 'Simply rest. Let the binaural tones do the work. Your only task is to remain gently aware.',
  },
  {
    time: 620,
    text: 'If thoughts arise, simply notice them and return your attention to the sound.',
  },

  // Theta descent announcement (13:00)
  {
    time: 780,
    text: 'The frequencies are beginning to descend from Alpha into Theta. You may feel a pleasant heaviness or a gentle drift.',
    chime: true,
  },
  {
    time: 810,
    text: 'Allow it. This is the entry point. Mind becoming more alert; body moving further away.',
  },

  // Focus 10 count-in (14:00–15:00)
  {
    time: 842,
    text: 'I will now count from one to ten. With each number, go deeper into this quiet space.',
    chime: true,
  },
  { time: 858, text: 'One.' },
  { time: 876, text: 'Two. Deeper.' },
  { time: 900, text: 'Three. Your body is becoming very distant.' },
  { time: 920, text: 'Four.' },
  { time: 938, text: 'Five. Halfway. Drifting deeper.' },
  { time: 956, text: 'Six.' },
  { time: 972, text: 'Seven. Your body is asleep. Your mind remains clear.' },
  { time: 988, text: 'Eight.' },
  { time: 1002, text: 'Nine.' },
  { time: 1018, text: 'Ten. Focus 10. Mind awake. Body asleep.' },

  // ── Phase 2: Focus 10 (15:00–25:00) ─────────────────────────────────────

  {
    time: 1040,
    text: 'Focus 10. You are here. Resting in this state. Notice the spatial sound rotating around you — this is the SAM layer, guiding your awareness in three dimensions.',
    chime: true,
  },
  {
    time: 1070,
    text: 'Simply observe. There is nothing to do. The tones and the spatial field are doing the work.',
  },

  // 24:00 — transition warning
  {
    time: 1440,
    text: 'In a moment, we move to Focus 12. Expanded awareness — your perception widens beyond your body.',
    chime: true,
  },

  // ── Phase 3: Focus 12 (25:00–35:00) ─────────────────────────────────────

  // Rocket pan fires at 25:30 automatically via rocketPanTime
  // Voice cue slightly after the pan sound
  {
    time: 1534,
    text: 'Focus 12. Expanded awareness. Feel the shift as your perception broadens in every direction.',
    chime: true,
  },
  {
    time: 1565,
    text: 'The spatial rotation has accelerated to fifteen cycles per second — a tremolo that widens the boundaries of self.',
  },
  {
    time: 1620,
    text: 'From this state, you may begin to perceive impressions, imagery, or a sense of presence. Simply observe without grasping.',
  },

  // Freeflow at 27:00 — silence until 33:00

  {
    time: 1980,
    text: 'We are approaching the threshold. Focus 15 — the state beyond time. Prepare yourself for deep silence.',
    chime: true,
  },
  {
    time: 2050,
    text: 'Let go of any remaining sense of your body. The void is opening.',
  },

  // ── Phase 4: Focus 15 / 21 (35:00–50:00) ────────────────────────────────

  // 35:00 — ambient drops, Gamma carrier fades in
  {
    time: 2103,
    text: 'Focus 15. No-Time. The ambient sound has faded into silence. You now exist outside of time.',
    chime: true,
  },
  {
    time: 2135,
    text: 'Feel two simultaneous layers in the sound — a slow one-and-a-half Hz Delta pulse, and a forty hertz Gamma carrier. This is the hyper-lucid void: slow wave and fast wave, coexisting.',
  },
  {
    time: 2185,
    text: 'Rest in timelessness. Let any impressions come to you without effort.',
  },

  // Freeflow hold 36:30–43:00 (silence)
  { time: 2190, chimeOnly: true, text: '' },

  // 43:00 — Focus 21 transition
  {
    time: 2580,
    text: 'Moving now to Focus 21. The Bridge. The furthest state on the edge of conscious perception.',
    chime: true,
  },
  {
    time: 2610,
    text: 'Focus 21. The deepest state. Remain a gentle observer. You are safe within your REBAL.',
  },

  // 45:00 — erratic SAM begins (2700s)
  {
    time: 2703,
    text: 'The spatial field is shifting — erratic, discontinuous. Allow your spatial tracking to release. This is the dimensional-shift threshold.',
    chime: true,
  },

  // Erratic SAM hold 45:00–50:00 (silence)

  // 49:00 — return announcement
  {
    time: 2940,
    text: 'The journey has reached its furthest point. We will now begin the return.',
    chime: true,
  },

  // ── Phase 5: Return (50:00–60:00) ────────────────────────────────────────

  {
    time: 3003,
    text: 'Begin to feel your awareness returning. The frequencies are ascending. The isochronic pulses are actively guiding your brain back to waking Beta.',
    chime: true,
  },
  {
    time: 3040,
    text: 'One. Feeling the edges of your body. Two. Three.',
  },
  {
    time: 3080,
    text: 'Four. Five. Energy is returning to your hands and feet.',
  },
  {
    time: 3120,
    text: 'Six. Seven. You are becoming more aware, more present.',
  },
  {
    time: 3180,
    text: 'Eight. Nine. Almost fully awake. Feeling refreshed and clear.',
    chime: true,
  },
  {
    time: 3240,
    text: 'Ten. Eleven. Twelve. Thirteen. Moving toward full waking Beta.',
  },
  {
    time: 3300,
    text: 'Fourteen. Fifteen. Your mind is alert. Your body is re-energized.',
    chime: true,
  },
  {
    time: 3390,
    text: 'Sixteen. Seventeen. Eighteen.',
  },
  {
    time: 3450,
    text: 'Nineteen. Twenty. Fully awake.',
    chime: true,
  },
  {
    time: 3480,
    text: 'Open your eyes when you are ready. You are awake, refreshed, and better in every way than before.',
  },
  {
    time: 3530,
    text: 'Take a moment before moving. Carry the awareness of this experience with you. You are more than your physical body.',
  },
  {
    time: 3570,
    text: 'Session complete.',
    chime: true,
  },
]
