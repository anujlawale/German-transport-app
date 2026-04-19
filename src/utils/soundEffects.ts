import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

type SoundEffectId = "bus" | "plane" | "train" | "success" | "pop";

type SoundConfig = {
  asset: number | null;
  placeholderPath: string;
};

const SOUND_CONFIG: Record<SoundEffectId, SoundConfig> = {
  bus: {
    asset: null,
    placeholderPath: "assets/sounds/bus-horn.mp3",
  },
  plane: {
    asset: null,
    placeholderPath: "assets/sounds/plane-whoosh.mp3",
  },
  train: {
    asset: null,
    placeholderPath: "assets/sounds/train-horn.mp3",
  },
  success: {
    asset: null,
    placeholderPath: "assets/sounds/success-chime.mp3",
  },
  pop: {
    asset: null,
    placeholderPath: "assets/sounds/balloon-pop.mp3",
  },
};

const BACKGROUND_MUSIC_ASSET: number | null = require("../../assets/sounds/background-music.mp3");

const players = new Map<SoundEffectId, ReturnType<typeof createAudioPlayer>>();
const missingSoundWarnings = new Set<SoundEffectId>();
let activeSoundId: SoundEffectId | null = null;
let isAudioConfigured = false;
let soundEnabled = true;
let backgroundMusicPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let backgroundMusicVolume = 0.18;

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

export async function playRewardPopSound(): Promise<void> {
  if (SOUND_CONFIG.pop.asset) {
    await playSoundEffect("pop");
    return;
  }

  await playSoundEffect("success");
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;

  if (!enabled) {
    stopAllSoundEffects();
    stopBackgroundMusic();
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
  stopBackgroundMusic();

  for (const player of players.values()) {
    player.release();
  }

  players.clear();
}

export async function startBackgroundMusic(): Promise<void> {
  if (!soundEnabled || !BACKGROUND_MUSIC_ASSET) {
    return;
  }

  await initializeSoundEffects();

  if (!backgroundMusicPlayer) {
    backgroundMusicPlayer = createAudioPlayer(BACKGROUND_MUSIC_ASSET);
    backgroundMusicPlayer.loop = true;
  }

  backgroundMusicPlayer.volume = backgroundMusicVolume;
  backgroundMusicPlayer.play();
}

export function stopBackgroundMusic(): void {
  if (!backgroundMusicPlayer) {
    return;
  }

  backgroundMusicPlayer.pause();
  backgroundMusicPlayer.seekTo(0);
}

export function setBackgroundMusicVolume(volume: number): void {
  backgroundMusicVolume = Math.max(0, Math.min(1, volume));

  if (backgroundMusicPlayer) {
    backgroundMusicPlayer.volume = backgroundMusicVolume;
  }
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
  void soundId;
  void placeholderPath;
}
