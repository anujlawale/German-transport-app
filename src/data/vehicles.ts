import { VehicleDefinition } from "../../types";

export const VEHICLES: VehicleDefinition[] = [
  {
    id: "bus",
    emoji: "🚌",
    label: "Bus",
    speechName: "Der Bus",
    questionPrompt: "Wo ist der Bus?",
    advancedPrompts: ["Wo ist der Bus?", "Tippe auf den Bus.", "Welcher fährt auf der Straße?"],
    phrase: "Der Bus fährt",
    color: "#ff8f5a",
    preferredZone: "road",
  },
  {
    id: "plane",
    emoji: "✈️",
    label: "Flugzeug",
    speechName: "Das Flugzeug",
    questionPrompt: "Wo ist das Flugzeug?",
    advancedPrompts: [
      "Wo ist das Flugzeug?",
      "Tippe auf das Flugzeug.",
      "Welches fliegt im Himmel?",
    ],
    phrase: "Das Flugzeug fliegt",
    color: "#90e0ef",
    preferredZone: "sky",
  },
  {
    id: "train",
    emoji: "🚆",
    label: "Zug",
    speechName: "Der Zug",
    questionPrompt: "Wo ist der Zug?",
    advancedPrompts: ["Wo ist der Zug?", "Tippe auf den Zug.", "Welcher fährt auf der Schiene?"],
    phrase: "Der Zug fährt",
    color: "#ff6b6b",
    preferredZone: "track",
  },
];
