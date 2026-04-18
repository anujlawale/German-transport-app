export type ItemId = string;

export type ZoneId = "sky" | "road" | "track";
export type ItemCategory = "transport" | "profession";
export type ItemAnimationStyle = "road" | "sky" | "track" | "character";
export type ItemSoundEffect = "bus" | "plane" | "train";
export type BookId = ItemCategory | "mixed";

export type DifficultyLevel = "easy" | "medium" | "advanced";

export type ItemDefinition = {
  id: ItemId;
  emoji: string;
  label: string;
  speechName: string;
  questionPrompt: string;
  advancedPrompts?: string[];
  phrase: string;
  color: string;
  category: ItemCategory;
  animationStyle: ItemAnimationStyle;
  soundEffect: ItemSoundEffect;
};

export type PictureBookDefinition = {
  id: BookId;
  label: string;
  emoji: string;
  color: string;
  accentColor: string;
  description: string;
};

export type Point = {
  x: number;
  y: number;
};
