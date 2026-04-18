import { Animated, Easing } from "react-native";
import { ItemDefinition } from "../../types";

export type VehicleMotionValues = {
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

export function createVehicleMotionValues(): VehicleMotionValues {
  return {
    bounce: new Animated.Value(1),
    slideX: new Animated.Value(0),
    liftY: new Animated.Value(0),
    tilt: new Animated.Value(0),
  };
}

export function runTapAnimation(item: ItemDefinition, motion: VehicleMotionValues) {
  stopMotion(motion);

  if (item.animationStyle === "road") {
    Animated.parallel([
      Animated.sequence([
        springScale(motion.bounce, 0.93),
        springScale(motion.bounce, 1.08),
        springScale(motion.bounce, 1),
      ]),
      Animated.sequence([
        timingMotion(motion.slideX, -7, 70),
        timingMotion(motion.slideX, 8, 90),
        timingMotion(motion.slideX, -4, 70),
        timingMotion(motion.slideX, 0, 80),
      ]),
    ]).start();
    return;
  }

  if (item.animationStyle === "sky") {
    Animated.parallel([
      Animated.sequence([
        timingMotion(motion.liftY, -12, 140),
        timingMotion(motion.liftY, -6, 120),
        timingMotion(motion.liftY, 0, 160),
      ]),
      Animated.sequence([
        timingMotion(motion.tilt, -1, 120),
        timingMotion(motion.tilt, 0.7, 140),
        timingMotion(motion.tilt, 0, 140),
      ]),
      Animated.sequence([
        springScale(motion.bounce, 1.05),
        springScale(motion.bounce, 1),
      ]),
    ]).start();
    return;
  }

  Animated.parallel([
    Animated.sequence([
      timingMotion(motion.slideX, 10, 90),
      timingMotion(motion.slideX, -5, 90),
      timingMotion(motion.slideX, 0, 100),
    ]),
    Animated.sequence([
      springScale(motion.bounce, 1.06),
      springScale(motion.bounce, 0.98),
      springScale(motion.bounce, 1),
    ]),
  ]).start();
}

export function runCelebrationAnimation(
  item: ItemDefinition,
  motion: VehicleMotionValues,
) {
  stopMotion(motion);

  if (item.animationStyle === "road") {
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

  if (item.animationStyle === "sky") {
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

export function runIncorrectTapAnimation(motion: VehicleMotionValues) {
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

function stopMotion(motion: VehicleMotionValues) {
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
