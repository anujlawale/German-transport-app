import type { ImageSourcePropType } from "react-native";

export type ItemId = string;

export type PictureBookId = "transport" | "profession" | "birds";
export type ItemMotionStyle = "ground" | "air" | "rail" | "water" | "character";
export type ItemSoundEffect = "bus" | "plane" | "train";
export type BookId = PictureBookId | "mixed";

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
  bookId: PictureBookId;
  motionStyle: ItemMotionStyle;
  soundEffect: ItemSoundEffect;
  imageSource?: ImageSourcePropType;
};

export type BookSceneAccent = {
  kind: "emoji" | "shape";
  value?: string;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  width?: number;
  height?: number;
  size?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  letterSpacing?: number;
};

export type PictureBookDefinition = {
  id: BookId;
  label: string;
  emoji: string;
  color: string;
  accentColor: string;
  description: string;
  sceneAccents?: BookSceneAccent[];
  defaultPromptHint?: string;
  promptHintsByMotionStyle?: Partial<Record<ItemMotionStyle, string>>;
};

export type Point = {
  x: number;
  y: number;
};
