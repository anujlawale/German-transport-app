import React, { ReactNode, useRef } from "react";
import { Animated, Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

type SceneReaction = "cloud" | "sun" | "station" | "airport";

type SceneWordButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  reaction?: SceneReaction;
  style?: StyleProp<ViewStyle>;
};

export function SceneWordButton({
  children,
  disabled = false,
  onPress,
  reaction,
  style,
}: SceneWordButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    scale.stopAnimation();
    floatY.stopAnimation();
    glowOpacity.stopAnimation();
    glowScale.stopAnimation();

    floatY.setValue(0);
    glowOpacity.setValue(0);
    glowScale.setValue(1);

    if (reaction === "sun") {
      Animated.parallel([
        Animated.spring(floatY, {
          toValue: -2,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
        Animated.sequence([
          Animated.spring(scale, {
            toValue: 1.14,
            useNativeDriver: true,
            speed: 18,
            bounciness: 6,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 5,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.18,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        Animated.spring(floatY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 7,
        }).start();
      });
    } else {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(floatY, {
            toValue: getLiftAmount(reaction),
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(floatY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 8,
          }),
        ]),
        Animated.sequence([
          Animated.spring(scale, {
            toValue: getBounceScale(reaction),
            useNativeDriver: true,
            speed: 20,
            bounciness: 7,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 6,
          }),
        ]),
      ]).start();
    }

    onPress();
  }

  return (
    <Pressable disabled={disabled} onPress={handlePress}>
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale }, { translateY: floatY }],
          },
        ]}
      >
        {children}
        {reaction === "sun" ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sunGlowWrap,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          >
            <Animated.View style={styles.sunGlow} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function getLiftAmount(reaction?: SceneReaction) {
  if (reaction === "station" || reaction === "airport") {
    return -4;
  }

  return -3;
}

function getBounceScale(reaction?: SceneReaction) {
  if (reaction === "cloud") {
    return 1.06;
  }

  return 1.04;
}

const styles = StyleSheet.create({
  sunGlowWrap: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  sunGlow: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "rgba(255, 227, 157, 0.28)",
  },
});
