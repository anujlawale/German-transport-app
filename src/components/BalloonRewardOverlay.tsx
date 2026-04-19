import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { playRewardPopSound } from "../utils/soundEffects";

export type BalloonRewardSource = "find" | "freePlay";

type BalloonConfig = {
  id: string;
  color: string;
  x: number;
  startY: number;
  size: number;
  swayDistance: number;
  swayDurationMs: number;
  driftDurationMs: number;
};

type BalloonRewardOverlayProps = {
  rewardSource: BalloonRewardSource;
  onComplete: () => void;
};

const BALLOON_COLORS = ["#ff7d8a", "#ffb54f", "#63c2ff", "#76d67c", "#ba8cff", "#ff8fc8", "#6de0d0"];

export function BalloonRewardOverlay({ rewardSource, onComplete }: BalloonRewardOverlayProps) {
  const { width, height } = useWindowDimensions();
  const safeWidth = Math.max(width, 360);
  const safeHeight = Math.max(height, 720);
  const balloonCount = rewardSource === "find" ? 6 : 5;
  const initialBalloons = useMemo(
    () => createBalloonConfigs(balloonCount, safeWidth, safeHeight),
    [balloonCount, safeHeight, safeWidth],
  );
  const [poppedBalloonIds, setPoppedBalloonIds] = useState<string[]>([]);
  const [showPraise, setShowPraise] = useState(false);
  const driftValues = useRef<Record<string, Animated.Value>>({});
  const swayValues = useRef<Record<string, Animated.Value>>({});
  const scaleValues = useRef<Record<string, Animated.Value>>({});
  const opacityValues = useRef<Record<string, Animated.Value>>({});
  const burstValues = useRef<Record<string, Animated.Value>>({});
  const burstOpacityValues = useRef<Record<string, Animated.Value>>({});
  const driftAnimations = useRef<Record<string, Animated.CompositeAnimation>>({});
  const swayAnimations = useRef<Record<string, Animated.CompositeAnimation>>({});
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function getAnimatedValue(
    valuesRef: React.MutableRefObject<Record<string, Animated.Value>>,
    id: string,
    initialValue: number,
  ) {
    if (!valuesRef.current[id]) {
      valuesRef.current[id] = new Animated.Value(initialValue);
    }

    return valuesRef.current[id];
  }

  useEffect(() => {
    initialBalloons.forEach((balloon, index) => {
      const drift = getAnimatedValue(driftValues, balloon.id, balloon.startY);
      const sway = getAnimatedValue(swayValues, balloon.id, 0);
      const scale = getAnimatedValue(scaleValues, balloon.id, 0.84);
      const opacity = getAnimatedValue(opacityValues, balloon.id, 0);
      const burst = getAnimatedValue(burstValues, balloon.id, 0.4);
      const burstOpacity = getAnimatedValue(burstOpacityValues, balloon.id, 0);

      burst.setValue(0.4);
      burstOpacity.setValue(0);
      scale.setValue(0.84);
      opacity.setValue(0);
      drift.setValue(balloon.startY);
      sway.setValue(0);

      const driftAnimation = Animated.timing(drift, {
        toValue: -balloon.size - 180,
        duration: balloon.driftDurationMs,
        delay: index * 120,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      });
      const swayAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(sway, {
            toValue: balloon.swayDistance,
            duration: balloon.swayDurationMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sway, {
            toValue: -balloon.swayDistance,
            duration: balloon.swayDurationMs,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      driftAnimations.current[balloon.id] = driftAnimation;
      swayAnimations.current[balloon.id] = swayAnimation;

      driftAnimation.start();
      swayAnimation.start();
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 9,
          delay: index * 120,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          delay: index * 120,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      Object.values(driftAnimations.current).forEach((animation) => animation.stop());
      Object.values(swayAnimations.current).forEach((animation) => animation.stop());
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
    };
  }, [initialBalloons]);

  useEffect(() => {
    if (poppedBalloonIds.length !== initialBalloons.length) {
      return;
    }

    setShowPraise(true);
    finishTimeoutRef.current = setTimeout(() => {
      onComplete();
    }, 850);

    return () => {
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
    };
  }, [initialBalloons.length, onComplete, poppedBalloonIds.length]);

  function handlePop(balloon: BalloonConfig) {
    if (poppedBalloonIds.includes(balloon.id)) {
      return;
    }

    setPoppedBalloonIds((current) => [...current, balloon.id]);
    void playRewardPopSound();

    driftAnimations.current[balloon.id]?.stop();
    swayAnimations.current[balloon.id]?.stop();

    const scale = getAnimatedValue(scaleValues, balloon.id, 1);
    const opacity = getAnimatedValue(opacityValues, balloon.id, 1);
    const burst = getAnimatedValue(burstValues, balloon.id, 0.4);
    const burstOpacity = getAnimatedValue(burstOpacityValues, balloon.id, 0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.22,
          duration: 120,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(burstOpacity, {
          toValue: 1,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(burstOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(burst, {
        toValue: 1.85,
        duration: 260,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }

  return (
    <View style={styles.overlay}>
      <View pointerEvents="none" style={styles.headerWrap}>
        <Text style={styles.kicker}>Reward Time!</Text>
        <Text style={styles.title}>
          {rewardSource === "find" ? "Ballon-Regen" : "Ballon-Party"}
        </Text>
        <Text style={styles.subtitle}>
          {rewardSource === "find" ? "Pop die Ballons!" : "Noch mehr Ballons!"}
        </Text>
      </View>

      <View pointerEvents="none" style={styles.backdropBubbleOne} />
      <View pointerEvents="none" style={styles.backdropBubbleTwo} />
      <View pointerEvents="none" style={styles.backdropBubbleThree} />

      {initialBalloons.map((balloon) => {
        const drift = getAnimatedValue(driftValues, balloon.id, balloon.startY);
        const sway = getAnimatedValue(swayValues, balloon.id, 0);
        const scale = getAnimatedValue(scaleValues, balloon.id, 1);
        const opacity = getAnimatedValue(opacityValues, balloon.id, 1);
        const burst = getAnimatedValue(burstValues, balloon.id, 0.4);
        const burstOpacity = getAnimatedValue(burstOpacityValues, balloon.id, 0);

        return (
          <Animated.View
            key={balloon.id}
            style={[
              styles.balloonWrap,
              {
                left: balloon.x,
                width: balloon.size + 26,
                height: balloon.size + 96,
                transform: [{ translateY: drift }, { translateX: sway }],
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ballon"
              onPress={() => handlePop(balloon)}
              disabled={poppedBalloonIds.includes(balloon.id)}
              style={[
                styles.balloonTouchTarget,
                {
                  width: balloon.size + 26,
                  height: balloon.size + 96,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.burstWrap,
                  {
                    opacity: burstOpacity,
                    transform: [{ scale: burst }],
                  },
                ]}
              >
                <View style={styles.burstDotTop} />
                <View style={styles.burstDotLeft} />
                <View style={styles.burstDotRight} />
                <View style={styles.burstDotBottom} />
                <Text style={styles.burstSparkle}>✨</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.balloonBody,
                  {
                    width: balloon.size,
                    height: balloon.size * 1.22,
                    backgroundColor: balloon.color,
                    opacity,
                    transform: [{ scale }],
                  },
                ]}
              >
                <View style={styles.balloonShine} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.balloonKnot,
                  {
                    opacity,
                    transform: [{ scale }],
                  },
                ]}
              />
                <Animated.View
                  style={[
                    styles.balloonString,
                  {
                    opacity,
                    height: Math.max(44, balloon.size * 0.58),
                  },
                ]}
              />
            </Pressable>
          </Animated.View>
        );
      })}

      {showPraise ? (
        <View pointerEvents="none" style={styles.praiseWrap}>
          <Text style={styles.praiseText}>Super!</Text>
        </View>
      ) : null}
    </View>
  );
}

function createBalloonConfigs(count: number, safeWidth: number, safeHeight: number): BalloonConfig[] {
  return Array.from({ length: count }, (_, index) => {
    const size = 86 + (index % 3) * 12;
    const laneCount = Math.max(2, count);
    const laneWidth = Math.max(48, (safeWidth - 40) / laneCount);
    const x = 12 + laneWidth * index + ((index % 2) * 10);

    return {
      id: `balloon-${index + 1}`,
      color: BALLOON_COLORS[index % BALLOON_COLORS.length] ?? "#ff7d8a",
      x: Math.min(x, safeWidth - size - 20),
      startY: safeHeight - 140 + (index % 3) * 54,
      size,
      swayDistance: 10 + (index % 3) * 4,
      swayDurationMs: 1900 + index * 180,
      driftDurationMs: 11800 + index * 650,
    };
  });
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 190,
    elevation: 190,
    backgroundColor: "#8fd8ff",
  },
  headerWrap: {
    position: "absolute",
    top: 68,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
  },
  kicker: {
    fontSize: 16,
    fontWeight: "900",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 1,
  },
  title: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: "900",
    color: "#fff8f0",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "800",
    color: "#e05b78",
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  backdropBubbleOne: {
    position: "absolute",
    top: 110,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  backdropBubbleTwo: {
    position: "absolute",
    top: 210,
    right: -24,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(255,241,199,0.22)",
  },
  backdropBubbleThree: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  balloonWrap: {
    position: "absolute",
    alignItems: "center",
  },
  balloonTouchTarget: {
    alignItems: "center",
  },
  balloonBody: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.84)",
    justifyContent: "flex-start",
    alignItems: "center",
    shadowColor: "#4f7196",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  balloonShine: {
    marginTop: 18,
    marginLeft: -22,
    width: 16,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.34)",
  },
  balloonKnot: {
    marginTop: -2,
    width: 12,
    height: 12,
    backgroundColor: "#fff1ea",
    transform: [{ rotate: "45deg" }],
    borderBottomLeftRadius: 3,
  },
  balloonString: {
    width: 2,
    backgroundColor: "rgba(106, 112, 127, 0.45)",
    borderRadius: 999,
  },
  burstWrap: {
    position: "absolute",
    top: 6,
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  burstDotTop: {
    position: "absolute",
    top: 4,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#fff6a8",
  },
  burstDotLeft: {
    position: "absolute",
    left: 8,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#ffd5e2",
  },
  burstDotRight: {
    position: "absolute",
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#d6f4ff",
  },
  burstDotBottom: {
    position: "absolute",
    bottom: 10,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#d6ffd3",
  },
  burstSparkle: {
    fontSize: 28,
  },
  praiseWrap: {
    position: "absolute",
    bottom: 92,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,250,241,0.96)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.98)",
  },
  praiseText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#5f7de5",
    textAlign: "center",
  },
});
