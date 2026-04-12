import { Animated, Easing } from "react-native";
import { VehicleId } from "../../types";

export type VehicleMotionValues = {
  bounce: Animated.Value;
  slideX: Animated.Value;
  liftY: Animated.Value;
  tilt: Animated.Value;
};

export function createVehicleMotionValues(): VehicleMotionValues {
  return {
    bounce: new Animated.Value(1),
    slideX: new Animated.Value(0),
    liftY: new Animated.Value(0),
    tilt: new Animated.Value(0),
  };
}

export function runTapAnimation(vehicleId: VehicleId, motion: VehicleMotionValues) {
  stopMotion(motion);

  if (vehicleId === "bus") {
    Animated.parallel([
      Animated.sequence([
        springScale(motion.bounce, 0.93),
        springScale(motion.bounce, 1.08),
        springScale(motion.bounce, 1),
      ]),
      Animated.sequence([
        timingX(motion.slideX, -7, 70),
        timingX(motion.slideX, 8, 90),
        timingX(motion.slideX, -4, 70),
        timingX(motion.slideX, 0, 80),
      ]),
    ]).start();
    return;
  }

  if (vehicleId === "plane") {
    Animated.parallel([
      Animated.sequence([
        timingLift(motion.liftY, -12, 140),
        timingLift(motion.liftY, -6, 120),
        timingLift(motion.liftY, 0, 160),
      ]),
      Animated.sequence([
        timingTilt(motion.tilt, -1, 120),
        timingTilt(motion.tilt, 0.7, 140),
        timingTilt(motion.tilt, 0, 140),
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
      timingX(motion.slideX, 10, 90),
      timingX(motion.slideX, -5, 90),
      timingX(motion.slideX, 0, 100),
    ]),
    Animated.sequence([
      springScale(motion.bounce, 1.06),
      springScale(motion.bounce, 0.98),
      springScale(motion.bounce, 1),
    ]),
  ]).start();
}

export function runCelebrationAnimation(
  vehicleId: VehicleId,
  motion: VehicleMotionValues,
) {
  stopMotion(motion);

  if (vehicleId === "bus") {
    Animated.parallel([
      Animated.sequence([
        springScale(motion.bounce, 1.14),
        springScale(motion.bounce, 1),
      ]),
      Animated.sequence([
        timingX(motion.slideX, 12, 120),
        timingX(motion.slideX, -6, 100),
        timingX(motion.slideX, 8, 110),
        timingX(motion.slideX, 0, 120),
      ]),
    ]).start();
    return;
  }

  if (vehicleId === "plane") {
    Animated.parallel([
      Animated.sequence([
        timingLift(motion.liftY, -18, 180),
        timingLift(motion.liftY, -8, 140),
        timingLift(motion.liftY, 0, 180),
      ]),
      Animated.sequence([
        timingTilt(motion.tilt, -1.4, 140),
        timingTilt(motion.tilt, 0.8, 140),
        timingTilt(motion.tilt, 0, 160),
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
      timingX(motion.slideX, 12, 100),
      timingX(motion.slideX, 2, 80),
      timingX(motion.slideX, 14, 100),
      timingX(motion.slideX, 0, 120),
    ]),
    Animated.sequence([
      springScale(motion.bounce, 1.12),
      springScale(motion.bounce, 1),
    ]),
  ]).start();
}

export function runIncorrectDropAnimation(motion: VehicleMotionValues) {
  stopMotion(motion);

  Animated.parallel([
    Animated.sequence([
      timingX(motion.slideX, -6, 60),
      timingX(motion.slideX, 6, 70),
      timingX(motion.slideX, -4, 60),
      timingX(motion.slideX, 0, 80),
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
    useNativeDriver: false,
    speed: 18,
    bounciness: 8,
  });
}

function timingX(value: Animated.Value, toValue: number, duration: number) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: false,
  });
}

function timingLift(value: Animated.Value, toValue: number, duration: number) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: false,
  });
}

function timingTilt(value: Animated.Value, toValue: number, duration: number) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.out(Easing.ease),
    useNativeDriver: false,
  });
}
