import React, { ReactNode, useRef } from "react";
import { Animated, Pressable, StyleProp, ViewStyle } from "react-native";

type SceneWordButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SceneWordButton({
  children,
  disabled = false,
  onPress,
  style,
}: SceneWordButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.08,
        useNativeDriver: true,
        speed: 22,
        bounciness: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 7,
      }),
    ]).start();

    onPress();
  }

  return (
    <Pressable disabled={disabled} onPress={handlePress}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
