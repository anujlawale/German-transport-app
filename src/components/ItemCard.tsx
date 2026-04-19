import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
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
  cardWidth: number;
  cardHeight: number;
  slotIndex: number;
  interactionEnabled: boolean;
  tapAnimationToken: number;
  celebrationToken: number;
  wrongTapToken: number;
  onTap: (item: ItemDefinition) => void;
  onLongPress?: (item: ItemDefinition) => void;
};

const IDLE_FLOAT_UP_DURATION_MS = 1200;
const IDLE_FLOAT_DOWN_DURATION_MS = 1200;

const CARD_LAYER_STYLE = { zIndex: 120, elevation: 18 } as const;

export function ItemCard({
  item,
  home,
  cardWidth,
  cardHeight,
  slotIndex: _slotIndex,
  interactionEnabled,
  tapAnimationToken,
  celebrationToken,
  wrongTapToken,
  onTap,
  onLongPress,
}: ItemCardProps) {
  const idleFloat = useRef(new Animated.Value(0)).current;
  const motion = useRef(createItemMotionValues()).current;
  const visualWidth = Math.min(cardWidth - 20, 138);
  const visualHeight = Math.min(Math.floor(cardHeight * 0.58), 124);
  const imageBottomMargin = item.imageSource ? 8 : 4;

  useEffect(() => {
    const floatLoop = createIdleFloatLoop(idleFloat);

    floatLoop.start();

    return () => {
      floatLoop.stop();
    };
  }, [idleFloat]);

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

  const combinedTransform = [
    { translateY: idleFloat },
    { translateX: motion.slideX },
    { translateY: motion.liftY },
    { scale: motion.bounce },
  ] as const;

  return (
    <Pressable
      disabled={!interactionEnabled}
      onPress={() => onTap(item)}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      delayLongPress={320}
      style={[
        styles.pressableWrap,
        {
          left: home.x,
          top: home.y,
          width: cardWidth,
          height: cardHeight,
        },
        CARD_LAYER_STYLE,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
            backgroundColor: item.color,
            transform: combinedTransform,
          },
        ]}
      >
        <View style={styles.faceRow}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View
          style={[
            styles.visualWrap,
            { width: visualWidth, height: visualHeight, marginBottom: imageBottomMargin },
          ]}
        >
          {item.imageSource ? (
            <Image
              source={item.imageSource}
              style={[styles.itemImage, { width: visualWidth, height: visualHeight }]}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.emoji}>{item.emoji}</Text>
          )}
        </View>
        <View style={[styles.badge, item.imageSource ? styles.imageBadge : null]}>
          <Text style={styles.badgeText}>{item.label}</Text>
        </View>
        <View style={styles.shadowDot} />
      </Animated.View>
    </Pressable>
  );
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
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
    ...createSurfaceShadow("#7d8795", 0.14, 14, 8, 6),
  },
  faceRow: {
    marginTop: 2,
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
  visualWrap: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  itemImage: {
    maxWidth: "100%",
    maxHeight: "100%",
  },
  badge: {
    marginTop: "auto",
    backgroundColor: "rgba(255,250,245,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
  },
  imageBadge: {
    marginTop: 4,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#675c62",
    textAlign: "center",
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
