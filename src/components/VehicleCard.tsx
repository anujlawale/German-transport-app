import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { Point, VehicleDefinition, ZoneId, ZoneLayout } from "../../types";
import { useVehicleDrag } from "../hooks/useVehicleDrag";
import {
  createVehicleMotionValues,
  runCelebrationAnimation,
  runIncorrectDropAnimation,
  runTapAnimation,
} from "../utils/vehicleAnimations";

type VehicleCardProps = {
  vehicle: VehicleDefinition;
  home: Point;
  zones: Record<ZoneId, ZoneLayout>;
  resetTrigger: number;
  interactionEnabled: boolean;
  tapAnimationToken: number;
  celebrationToken: number;
  incorrectDropToken: number;
  onTap: (vehicle: VehicleDefinition) => void;
  onMatch: (vehicle: VehicleDefinition) => void;
  onIncorrectDrop: (vehicle: VehicleDefinition) => void;
  onDragUpdate: (
    vehicle: VehicleDefinition,
    update: { isDragging: boolean; isNearPreferredZone: boolean },
  ) => void;
};

export function VehicleCard({
  vehicle,
  home,
  zones,
  resetTrigger,
  interactionEnabled,
  tapAnimationToken,
  celebrationToken,
  incorrectDropToken,
  onTap,
  onMatch,
  onIncorrectDrop,
  onDragUpdate,
}: VehicleCardProps) {
  const idleFloat = useRef(new Animated.Value(0)).current;
  const idleWiggle = useRef(new Animated.Value(0)).current;
  const motion = useRef(createVehicleMotionValues()).current;
  const {
    cardSize,
    dragScale,
    dragTranslateX,
    dragTranslateY,
    isDragging,
    panHandlers,
  } = useVehicleDrag({
    vehicle,
    home,
    preferredZone: zones[vehicle.preferredZone],
    resetTrigger,
    interactionEnabled,
    onTap,
    onMatch,
    onIncorrectDrop,
    onDragUpdate: (update) => onDragUpdate(vehicle, update),
  });

  useEffect(() => {
    if (isDragging) {
      idleFloat.stopAnimation();
      idleWiggle.stopAnimation();
      idleFloat.setValue(0);
      idleWiggle.setValue(0);
      return;
    }

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleFloat, {
          toValue: -4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(idleFloat, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    const wiggleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(idleWiggle, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(idleWiggle, {
          toValue: -1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(idleWiggle, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    floatLoop.start();
    wiggleLoop.start();

    return () => {
      floatLoop.stop();
      wiggleLoop.stop();
    };
  }, [idleFloat, idleWiggle, isDragging]);

  useEffect(() => {
    if (tapAnimationToken > 0) {
      runTapAnimation(vehicle.id, motion);
    }
  }, [motion, tapAnimationToken, vehicle.id]);

  useEffect(() => {
    if (celebrationToken > 0) {
      runCelebrationAnimation(vehicle.id, motion);
    }
  }, [celebrationToken, motion, vehicle.id]);

  useEffect(() => {
    if (incorrectDropToken > 0) {
      runIncorrectDropAnimation(motion);
    }
  }, [incorrectDropToken, motion]);

  const combinedTransform = [
    { translateX: dragTranslateX },
    { translateY: dragTranslateY },
    { scale: dragScale },
    { translateY: idleFloat },
    {
      rotate: idleWiggle.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ["-2deg", "0deg", "2deg"],
      }),
    },
    { translateX: motion.slideX },
    { translateY: motion.liftY },
    {
      rotate: motion.tilt.interpolate({
        inputRange: [-2, 0, 2],
        outputRange: ["-8deg", "0deg", "8deg"],
      }),
    },
    { scale: motion.bounce },
  ] as const;

  return (
    <Animated.View
      {...panHandlers}
      pointerEvents={interactionEnabled ? "auto" : "none"}
      style={[
        styles.card,
        {
          width: cardSize,
          height: cardSize,
          backgroundColor: vehicle.color,
          zIndex: isDragging ? 10 : 6,
          elevation: isDragging ? 7 : 6,
          transform: combinedTransform,
        },
      ]}
    >
      <Text style={styles.emoji}>{vehicle.emoji}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{vehicle.label}</Text>
      </View>
    </Animated.View>
  );
}

function createSurfaceShadow(
  color: string,
  opacity: number,
  radius: number,
  offsetY: number,
  elevation: number,
) {
  if (Platform.OS === "web") {
    return {
      boxShadow: `0px ${offsetY}px ${radius * 2}px rgba(${hexToRgb(color)}, ${opacity})`,
    } as const;
  }

  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: offsetY },
    elevation,
  } as const;
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const intValue = Number.parseInt(value, 16);

  return `${(intValue >> 16) & 255}, ${(intValue >> 8) & 255}, ${intValue & 255}`;
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.96)",
    justifyContent: "center",
    alignItems: "center",
    ...createSurfaceShadow("#31536b", 0.18, 14, 8, 7),
  },
  emoji: {
    fontSize: 56,
  },
  badge: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#21455f",
  },
});
