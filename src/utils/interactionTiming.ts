export const INTERACTION_TIMING = {
  cooldown: {
    // Prevents near-simultaneous repeat taps from stacking messy feedback.
    minGapMs: 120,
  },
  tap: {
    soundDelayMs: 90,
    speechDelayMs: 220,
    settleDelayMs: 420,
  },
  correctDrop: {
    soundDelayMs: 100,
    speechDelayMs: 220,
    celebrationDelayMs: 120,
  },
  wrongDrop: {
    speechDelayMs: 220,
    settleDelayMs: 380,
  },
  completion: {
    successDelayMs: 560,
    speechDelayMs: 900,
  },
  game: {
    nextPromptDelayMs: 1400,
  },
  feedback: {
    successBubbleDurationMs: 1800,
    starBurstDurationMs: 760,
  },
} as const;
