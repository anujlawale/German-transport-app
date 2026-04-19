import { Animated, Easing } from "react-native";
import { ItemDefinition } from "../../types";

export type ItemMotionValues = {
  bounce: Animated.Value;
  slideX: Animated.Value;
  liftY: Animated.Value;
  tilt: Animated.Value;
};

const MOTION_EASING = Easing.out(Easing.ease);
const SPRING_CONFIG = {
  useNativeDriver: false,
  speed: 18,
  bounciness: 8,
} as const;

export function createItemMotionValues(): ItemMotionValues {
  return {
    bounce: new Animated.Value(1),
    slideX: new Animated.Value(0),
    liftY: new Animated.Value(0),
    tilt: new Animated.Value(0),
  };
}

export function runTapAnimation(item: ItemDefinition, motion: ItemMotionValues) {
  stopMotion(motion);

  const animation = getTapReactionAnimation(item, motion);
  animation.start();
}

export function runCelebrationAnimation(item: ItemDefinition, motion: ItemMotionValues) {
  stopMotion(motion);

  if (item.motionStyle === "ground") {
    Animated.parallel([
      Animated.sequence([
        springScale(motion.bounce, 1.14),
        springScale(motion.bounce, 1),
      ]),
      Animated.sequence([
        timingMotion(motion.slideX, 12, 120),
        timingMotion(motion.slideX, -6, 100),
        timingMotion(motion.slideX, 8, 110),
        timingMotion(motion.slideX, 0, 120),
      ]),
    ]).start();
    return;
  }

  if (item.motionStyle === "air") {
    Animated.parallel([
      Animated.sequence([
        timingMotion(motion.liftY, -18, 180),
        timingMotion(motion.liftY, -8, 140),
        timingMotion(motion.liftY, 0, 180),
      ]),
      Animated.sequence([
        timingMotion(motion.tilt, -1.4, 140),
        timingMotion(motion.tilt, 0.8, 140),
        timingMotion(motion.tilt, 0, 160),
      ]),
      Animated.sequence([
        springScale(motion.bounce, 1.1),
        springScale(motion.bounce, 1),
      ]),
    ]).start();
    return;
  }

  if (item.motionStyle === "water") {
    Animated.parallel([
      Animated.sequence([
        timingMotion(motion.liftY, -12, 160),
        timingMotion(motion.liftY, -4, 120),
        timingMotion(motion.liftY, 0, 170),
      ]),
      Animated.sequence([
        timingMotion(motion.tilt, -1.2, 130),
        timingMotion(motion.tilt, 1.1, 140),
        timingMotion(motion.tilt, 0, 160),
      ]),
      Animated.sequence([
        springScale(motion.bounce, 1.08),
        springScale(motion.bounce, 1),
      ]),
    ]).start();
    return;
  }

  Animated.parallel([
    Animated.sequence([
      timingMotion(motion.slideX, 12, 100),
      timingMotion(motion.slideX, 2, 80),
      timingMotion(motion.slideX, 14, 100),
      timingMotion(motion.slideX, 0, 120),
    ]),
    Animated.sequence([
      springScale(motion.bounce, 1.12),
      springScale(motion.bounce, 1),
    ]),
  ]).start();
}

export function runIncorrectTapAnimation(motion: ItemMotionValues) {
  stopMotion(motion);

  Animated.parallel([
    Animated.sequence([
      timingMotion(motion.slideX, -6, 60),
      timingMotion(motion.slideX, 6, 70),
      timingMotion(motion.slideX, -4, 60),
      timingMotion(motion.slideX, 0, 80),
    ]),
    Animated.sequence([
      springScale(motion.bounce, 1.03),
      springScale(motion.bounce, 1),
    ]),
  ]).start();
}

function stopMotion(motion: ItemMotionValues) {
  motion.bounce.stopAnimation();
  motion.slideX.stopAnimation();
  motion.liftY.stopAnimation();
  motion.tilt.stopAnimation();
  motion.bounce.setValue(1);
  motion.slideX.setValue(0);
  motion.liftY.setValue(0);
  motion.tilt.setValue(0);
}

function springScale(value: Animated.Value, toValue: number) {
  return Animated.spring(value, {
    toValue,
    ...SPRING_CONFIG,
  });
}

function timingMotion(value: Animated.Value, toValue: number, duration: number) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: MOTION_EASING,
    useNativeDriver: false,
  });
}

function getTapReactionAnimation(item: ItemDefinition, motion: ItemMotionValues) {
  switch (item.tapReaction) {
    case "drive":
      return Animated.parallel([
        Animated.sequence([
          springScale(motion.bounce, 0.94),
          springScale(motion.bounce, 1.08),
          springScale(motion.bounce, 1),
        ]),
        Animated.sequence([
          timingMotion(motion.slideX, -8, 70),
          timingMotion(motion.slideX, 10, 90),
          timingMotion(motion.slideX, -4, 70),
          timingMotion(motion.slideX, 0, 80),
        ]),
        Animated.sequence([
          timingMotion(motion.tilt, -0.4, 70),
          timingMotion(motion.tilt, 0.5, 90),
          timingMotion(motion.tilt, 0, 80),
        ]),
      ]);
    case "fly":
      return Animated.parallel([
        Animated.sequence([
          timingMotion(motion.liftY, -13, 130),
          timingMotion(motion.liftY, -7, 110),
          timingMotion(motion.liftY, 0, 150),
        ]),
        Animated.sequence([
          timingMotion(motion.tilt, -1.4, 120),
          timingMotion(motion.tilt, 0.9, 130),
          timingMotion(motion.tilt, 0, 140),
        ]),
        Animated.sequence([
          springScale(motion.bounce, 1.05),
          springScale(motion.bounce, 1),
        ]),
      ]);
    case "bob":
      return Animated.parallel([
        Animated.sequence([
          timingMotion(motion.liftY, -7, 110),
          timingMotion(motion.liftY, -2, 90),
          timingMotion(motion.liftY, -6, 100),
          timingMotion(motion.liftY, 0, 130),
        ]),
        Animated.sequence([
          timingMotion(motion.tilt, -0.7, 100),
          timingMotion(motion.tilt, 0.7, 110),
          timingMotion(motion.tilt, 0, 120),
        ]),
        Animated.sequence([
          springScale(motion.bounce, 1.03),
          springScale(motion.bounce, 1),
        ]),
      ]);
    case "waddle":
      return Animated.parallel([
        Animated.sequence([
          timingMotion(motion.slideX, -5, 80),
          timingMotion(motion.slideX, 6, 90),
          timingMotion(motion.slideX, -4, 80),
          timingMotion(motion.slideX, 4, 90),
          timingMotion(motion.slideX, 0, 80),
        ]),
        Animated.sequence([
          timingMotion(motion.tilt, -1.1, 80),
          timingMotion(motion.tilt, 1.1, 90),
          timingMotion(motion.tilt, -0.8, 80),
          timingMotion(motion.tilt, 0.8, 90),
          timingMotion(motion.tilt, 0, 80),
        ]),
        Animated.sequence([
          springScale(motion.bounce, 1.03),
          springScale(motion.bounce, 1),
        ]),
      ]);
    case "wave":
      return Animated.parallel([
        Animated.sequence([
          springScale(motion.bounce, 1.07),
          springScale(motion.bounce, 0.98),
          springScale(motion.bounce, 1),
        ]),
        Animated.sequence([
          timingMotion(motion.liftY, -5, 100),
          timingMotion(motion.liftY, 0, 120),
        ]),
        Animated.sequence([
          timingMotion(motion.tilt, -0.9, 100),
          timingMotion(motion.tilt, 0.9, 100),
          timingMotion(motion.tilt, 0, 110),
        ]),
      ]);
  }
}
