import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

type SoundEffectId = "bus" | "plane" | "train" | "success";

type SoundConfig = {
  asset: number | null;
  placeholderPath: string;
};

const SOUND_CONFIG: Record<SoundEffectId, SoundConfig> = {
  bus: {
    // Replace with: require("../../assets/sounds/bus-horn.mp3")
    asset: null,
    placeholderPath: "assets/sounds/bus-horn.mp3",
  },
  plane: {
    // Replace with: require("../../assets/sounds/plane-whoosh.mp3")
    asset: null,
    placeholderPath: "assets/sounds/plane-whoosh.mp3",
  },
  train: {
    // Replace with: require("../../assets/sounds/train-horn.mp3")
    asset: null,
    placeholderPath: "assets/sounds/train-horn.mp3",
  },
  success: {
    // Replace with: require("../../assets/sounds/success-chime.mp3")
    asset: null,
    placeholderPath: "assets/sounds/success-chime.mp3",
  },
};

const players = new Map<SoundEffectId, ReturnType<typeof createAudioPlayer>>();
const missingSoundWarnings = new Set<SoundEffectId>();
let activeSoundId: SoundEffectId | null = null;
let isAudioConfigured = false;
let soundEnabled = true;

export async function initializeSoundEffects(): Promise<void> {
  if (isAudioConfigured) {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
    shouldPlayInBackground: false,
  });
  isAudioConfigured = true;
}

export async function playSoundEffect(soundId: SoundEffectId): Promise<void> {
  if (!soundEnabled) {
    return;
  }

  const config = SOUND_CONFIG[soundId];

  if (!config.asset) {
    warnMissingSoundOnce(soundId, config.placeholderPath);
    return;
  }

  await initializeSoundEffects();

  if (activeSoundId && activeSoundId !== soundId) {
    stopPlayer(activeSoundId);
  }

  const player = getOrCreatePlayer(soundId, config.asset);
  player.seekTo(0);
  player.play();
  activeSoundId = soundId;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;

  if (!enabled) {
    stopAllSoundEffects();
  }
}

export function stopAllSoundEffects(): void {
  for (const soundId of players.keys()) {
    stopPlayer(soundId);
  }
  activeSoundId = null;
}

export function releaseSoundEffects(): void {
  stopAllSoundEffects();

  for (const player of players.values()) {
    player.release();
  }

  players.clear();
}

function getOrCreatePlayer(soundId: SoundEffectId, asset: number) {
  const existingPlayer = players.get(soundId);

  if (existingPlayer) {
    return existingPlayer;
  }

  const nextPlayer = createAudioPlayer(asset);
  players.set(soundId, nextPlayer);
  return nextPlayer;
}

function stopPlayer(soundId: SoundEffectId) {
  const player = players.get(soundId);

  if (!player) {
    return;
  }

  player.pause();
  player.seekTo(0);
}

function warnMissingSoundOnce(soundId: SoundEffectId, placeholderPath: string) {
  if (missingSoundWarnings.has(soundId)) {
    return;
  }

  missingSoundWarnings.add(soundId);
  console.log(`[mock-sfx] Missing ${soundId} sound. Add file at ${placeholderPath}`);
}
