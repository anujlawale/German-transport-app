import { ItemId } from "../../types";
import * as Speech from "expo-speech";
import { ITEMS } from "../data/items";
import { playSoundEffect } from "./soundEffects";

const GERMAN_SPEECH_OPTIONS: Speech.SpeechOptions = {
  language: "de-DE",
  pitch: 1,
  rate: 0.75,
};

let speechEnabled = true;

const ITEM_SOUND_EFFECT: Record<ItemId, "bus" | "plane" | "train"> = ITEMS.reduce(
  (map, item) => {
    map[item.id] = item.soundEffect;
    return map;
  },
  {} as Record<ItemId, "bus" | "plane" | "train">,
);

export function playItemSound(itemId: ItemId): void {
  void playSoundEffect(ITEM_SOUND_EFFECT[itemId] ?? "bus");
}

export function playSuccessSound(): void {
  void playSoundEffect("success");
}

export async function speakGerman(text: string): Promise<void> {
  if (!speechEnabled) {
    return;
  }

  await Speech.stop();
  Speech.speak(text, GERMAN_SPEECH_OPTIONS);
}

export async function stopGermanSpeech(): Promise<void> {
  await Speech.stop();
}

export async function setSpeechEnabled(enabled: boolean): Promise<void> {
  speechEnabled = enabled;

  if (!enabled) {
    await Speech.stop();
  }
}
