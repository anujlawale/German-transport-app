import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ItemDefinition, Point } from "../../types";
import {
  createItemMotionValues,
  runCelebrationAnimation,
  runIncorrectTapAnimation,
  runTapAnimation,
} from "../utils/itemAnimations";

type ItemCardProps = {
  item: ItemDefinition;
  home: Point;
  cardSize: number;
  slotIndex: number;
  interactionEnabled: boolean;
  tapAnimationToken: number;
  celebrationToken: number;
  wrongTapToken: number;
  onTap: (item: ItemDefinition) => void;
};

const IDLE_FLOAT_UP_DURATION_MS = 1200;
const IDLE_FLOAT_DOWN_DURATION_MS = 1200;
const IDLE_WIGGLE_STEP_DURATION_MS = 1400;

const CARD_LAYER_STYLE = { zIndex: 120, elevation: 18 } as const;

export function ItemCard({
  item,
  home,
  cardSize,
  slotIndex,
  interactionEnabled,
  tapAnimationToken,
  celebrationToken,
  wrongTapToken,
  onTap,
}: ItemCardProps) {
  const idleFloat = useRef(new Animated.Value(0)).current;
  const idleWiggle = useRef(new Animated.Value(0)).current;
  const motion = useRef(createItemMotionValues()).current;

  useEffect(() => {
    const floatLoop = createIdleFloatLoop(idleFloat);
    const wiggleLoop = createIdleWiggleLoop(idleWiggle);

    floatLoop.start();
    wiggleLoop.start();

    return () => {
      floatLoop.stop();
      wiggleLoop.stop();
    };
  }, [idleFloat, idleWiggle]);

  useEffect(() => {
    if (tapAnimationToken > 0) {
      runTapAnimation(item, motion);
    }
  }, [item, motion, tapAnimationToken]);

  useEffect(() => {
    if (celebrationToken > 0) {
      runCelebrationAnimation(item, motion);
    }
  }, [celebrationToken, item, motion]);

  useEffect(() => {
    if (wrongTapToken > 0) {
      runIncorrectTapAnimation(motion);
    }
  }, [wrongTapToken, motion]);

  const baseTilt = getBaseTilt(slotIndex);
  const combinedTransform = [
    { translateY: idleFloat },
    {
      rotate: idleWiggle.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [`${baseTilt - 2}deg`, `${baseTilt}deg`, `${baseTilt + 2}deg`],
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
    <Pressable
      disabled={!interactionEnabled}
      onPress={() => onTap(item)}
      style={[
        styles.pressableWrap,
        {
          left: home.x,
          top: home.y,
          width: cardSize,
          height: cardSize,
        },
        CARD_LAYER_STYLE,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.card,
          {
            width: cardSize,
            height: cardSize,
            backgroundColor: item.color,
            transform: combinedTransform,
          },
        ]}
      >
        <View style={styles.faceRow}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.label}</Text>
        </View>
        <View style={styles.shadowDot} />
      </Animated.View>
    </Pressable>
  );
}

function getBaseTilt(slotIndex: number) {
  if (slotIndex === 0) {
    return -4;
  }

  if (slotIndex === 2) {
    return 3;
  }

  return 0;
}

const styles = StyleSheet.create({
  pressableWrap: {
    position: "absolute",
  },
  card: {
    flex: 1,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.96)",
    justifyContent: "center",
    alignItems: "center",
    ...createSurfaceShadow("#7d8795", 0.14, 14, 8, 6),
  },
  faceRow: {
    position: "absolute",
    top: 15,
    flexDirection: "row",
    gap: 10,
    opacity: 0.72,
  },
  eye: {
    width: 7,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(70,60,56,0.65)",
  },
  emoji: {
    fontSize: 52,
  },
  badge: {
    marginTop: 10,
    backgroundColor: "rgba(255,250,245,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
  },
  badgeText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#675c62",
  },
  shadowDot: {
    position: "absolute",
    bottom: 10,
    width: 44,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(122, 116, 110, 0.1)",
  },
});

function createIdleFloatLoop(idleFloat: Animated.Value) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(idleFloat, {
        toValue: -4,
        duration: IDLE_FLOAT_UP_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(idleFloat, {
        toValue: 0,
        duration: IDLE_FLOAT_DOWN_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]),
  );
}

function createIdleWiggleLoop(idleWiggle: Animated.Value) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(idleWiggle, {
        toValue: 1,
        duration: IDLE_WIGGLE_STEP_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(idleWiggle, {
        toValue: -1,
        duration: IDLE_WIGGLE_STEP_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(idleWiggle, {
        toValue: 0,
        duration: IDLE_WIGGLE_STEP_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]),
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
