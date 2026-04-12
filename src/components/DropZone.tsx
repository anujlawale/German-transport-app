import { Animated, Platform, StyleSheet, Text } from "react-native";
import { useEffect, useRef } from "react";
import { ZoneLayout } from "../../types";

type DropZoneProps = {
  zone: ZoneLayout;
  isHighlighted: boolean;
};

export function DropZone({ zone, isHighlighted }: DropZoneProps) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glow, {
      toValue: isHighlighted ? 1 : 0,
      duration: isHighlighted ? 140 : 220,
      useNativeDriver: false,
    }).start();
  }, [glow, isHighlighted]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.zone,
        {
          left: zone.x,
          top: zone.y,
          width: zone.width,
          height: zone.height,
          backgroundColor: zone.color,
          borderColor: glow.interpolate({
            inputRange: [0, 1],
            outputRange: ["rgba(255,255,255,0.65)", "#ffffff"],
          }),
          ...(Platform.OS === "web"
            ? {
                boxShadow: isHighlighted
                  ? "0px 6px 36px rgba(255,255,255,0.4)"
                  : "0px 2px 10px rgba(255,255,255,0.18)",
              }
            : {
                shadowOpacity: glow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.08, 0.28],
                }),
                shadowRadius: glow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 18],
                }),
              }),
          transform: [
            {
              scale: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.label}>{zone.title}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: "absolute",
    zIndex: 0,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.72)",
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web" ? {} : { shadowColor: "#ffffff" }),
    elevation: 0,
  },
  label: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.48)",
    fontSize: 24,
    fontWeight: "900",
    color: "#31536b",
  },
});
