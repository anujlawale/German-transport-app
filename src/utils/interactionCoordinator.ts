import { VehicleId } from "../../types";
import { playSuccessSound, playVehicleSound, speakGerman, stopGermanSpeech } from "./audio";
import { INTERACTION_TIMING } from "./interactionTiming";

type TimeoutId = ReturnType<typeof setTimeout>;

type PendingTimers = {
  sound?: TimeoutId;
  speech?: TimeoutId;
  extraOne?: TimeoutId;
  extraTwo?: TimeoutId;
  extraThree?: TimeoutId;
};

const pendingTimers: PendingTimers = {};
let interactionToken = 0;
let lastInteractionStartedAt = 0;

export function queueTapFeedback(options: {
  vehicleId: VehicleId;
  speech: string;
  soundDelayMs: number;
  speechDelayMs: number;
}) {
  const { token, delayOffsetMs } = beginInteraction();

  pendingTimers.sound = setTimeout(() => {
    if (!isActiveToken(token)) {
      return;
    }
    playVehicleSound(options.vehicleId);
  }, options.soundDelayMs + delayOffsetMs);

  // Speech intentionally trails the sound effect a bit so toddlers first get an
  // immediate reward, then a clearer spoken German word without both cues colliding.
  pendingTimers.speech = setTimeout(() => {
    if (!isActiveToken(token)) {
      return;
    }
    void speakGerman(options.speech);
  }, options.speechDelayMs + delayOffsetMs);
}

export function queueCorrectDropFeedback(options: {
  speech: string;
  soundDelayMs: number;
  speechDelayMs: number;
  extraOneDelayMs?: number;
  onExtraOne?: () => void;
  extraTwoDelayMs?: number;
  onExtraTwo?: () => void;
  extraThreeDelayMs?: number;
  onExtraThree?: () => void;
}) {
  const { token, delayOffsetMs } = beginInteraction();

  pendingTimers.sound = setTimeout(() => {
    if (!isActiveToken(token)) {
      return;
    }
    playSuccessSound();
  }, options.soundDelayMs + delayOffsetMs);

  // The spoken phrase starts after the short reward sound so the audio remains
  // warm and readable instead of sounding like two cues fighting each other.
  pendingTimers.speech = setTimeout(() => {
    if (!isActiveToken(token)) {
      return;
    }
    void speakGerman(options.speech);
  }, options.speechDelayMs + delayOffsetMs);

  if (options.onExtraOne && options.extraOneDelayMs !== undefined) {
    pendingTimers.extraOne = setTimeout(() => {
      if (!isActiveToken(token)) {
        return;
      }
      options.onExtraOne?.();
    }, options.extraOneDelayMs + delayOffsetMs);
  }

  if (options.onExtraTwo && options.extraTwoDelayMs !== undefined) {
    pendingTimers.extraTwo = setTimeout(() => {
      if (!isActiveToken(token)) {
        return;
      }
      options.onExtraTwo?.();
    }, options.extraTwoDelayMs + delayOffsetMs);
  }

  if (options.onExtraThree && options.extraThreeDelayMs !== undefined) {
    pendingTimers.extraThree = setTimeout(() => {
      if (!isActiveToken(token)) {
        return;
      }
      options.onExtraThree?.();
    }, options.extraThreeDelayMs + delayOffsetMs);
  }
}

export function queueIncorrectDropSpeech(text: string, delayMs: number) {
  const { token, delayOffsetMs } = beginInteraction();

  pendingTimers.speech = setTimeout(() => {
    if (!isActiveToken(token)) {
      return;
    }
    void speakGerman(text);
  }, delayMs + delayOffsetMs);
}

export function clearInteractionQueue() {
  interactionToken += 1;
  clearTimers();
  void stopGermanSpeech();
}

function beginInteraction() {
  clearInteractionQueue();
  const now = Date.now();
  const elapsedMs = now - lastInteractionStartedAt;
  const delayOffsetMs =
    elapsedMs < INTERACTION_TIMING.cooldown.minGapMs
      ? INTERACTION_TIMING.cooldown.minGapMs - elapsedMs
      : 0;

  lastInteractionStartedAt = now + delayOffsetMs;
  return { token: interactionToken, delayOffsetMs };
}

function clearTimers() {
  for (const timer of Object.values(pendingTimers)) {
    if (timer) {
      clearTimeout(timer);
    }
  }

  pendingTimers.sound = undefined;
  pendingTimers.speech = undefined;
  pendingTimers.extraOne = undefined;
  pendingTimers.extraTwo = undefined;
  pendingTimers.extraThree = undefined;
}

function isActiveToken(token: number) {
  return token === interactionToken;
}
