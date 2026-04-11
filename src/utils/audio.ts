import { VehicleId } from "../../types";
import * as Speech from "expo-speech";
import { playSoundEffect } from "./soundEffects";

const GERMAN_SPEECH_OPTIONS: Speech.SpeechOptions = {
  language: "de-DE",
  pitch: 1,
  rate: 0.75,
};

let speechEnabled = true;

export function playVehicleSound(vehicleId: VehicleId): void {
  void playSoundEffect(vehicleId);
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
