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
  correctSelection: {
    soundDelayMs: 100,
    speechDelayMs: 220,
    celebrationDelayMs: 120,
  },
  wrongSelection: {
    speechDelayMs: 220,
    settleDelayMs: 380,
  },
  completion: {
    successDelayMs: 560,
    speechDelayMs: 2200,
  },
  game: {
    // Leaves enough room for the completion phrase to finish before the next
    // Find Game prompt starts speaking and takes over the audio channel.
    nextPromptDelayMs: 4600,
  },
  feedback: {
    successBubbleDurationMs: 1800,
    starBurstDurationMs: 760,
  },
} as const;
