export type VehicleId = string;

export type ZoneId = "sky" | "road" | "track";

export type DifficultyLevel = "easy" | "medium" | "advanced";

export type VehicleDefinition = {
  id: VehicleId;
  emoji: string;
  label: string;
  speechName: string;
  questionPrompt: string;
  advancedPrompts?: string[];
  phrase: string;
  color: string;
  preferredZone: ZoneId;
};

export type Point = {
  x: number;
  y: number;
};
