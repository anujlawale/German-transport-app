import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DropZone } from "./src/components/DropZone";
import { FindGameModal } from "./src/components/FindGameModal";
import { SceneWordButton } from "./src/components/SceneWordButton";
import { VehicleCard } from "./src/components/VehicleCard";
import { VEHICLES } from "./src/data/vehicles";
import { setSpeechEnabled, speakGerman, stopGermanSpeech } from "./src/utils/audio";
import {
  clearInteractionQueue,
  queueCorrectDropFeedback,
  queueIncorrectDropSpeech,
  queueTapFeedback,
} from "./src/utils/interactionCoordinator";
import { INTERACTION_TIMING } from "./src/utils/interactionTiming";
import {
  initializeSoundEffects,
  releaseSoundEffects,
  setSoundEnabled,
  stopAllSoundEffects,
} from "./src/utils/soundEffects";
import { DifficultyLevel, VehicleDefinition, VehicleId, ZoneId, ZoneLayout } from "./types";

type VehicleHomeMap = Record<VehicleId, { x: number; y: number }>;
type VehicleTokenMap = Record<VehicleId, number>;

const EMPTY_TOKENS: VehicleTokenMap = {
  bus: 0,
  plane: 0,
  train: 0,
};

const MODE_HINTS = {
  freePlay: "Tippe alles an und lerne deutsche Wörter.",
  game: "Finde das richtige Fahrzeug.",
} as const;

const DIFFICULTY_DETAILS: Record<DifficultyLevel, string> = {
  easy: "Only names.",
  medium: "Names and simple phrases.",
  advanced: "Find Game uses mixed prompts.",
};

const SCENE_ITEMS = [
  { id: "cloud-left", label: "Wolke", phrase: "Die Wolke", style: "cloudOne" as const },
  { id: "cloud-right", label: "Wolke", phrase: "Die Wolke", style: "cloudTwo" as const },
  { id: "sun", label: "Sonne", phrase: "Die Sonne", style: "sun" as const },
  { id: "station", label: "Bahnhof", phrase: "Der Bahnhof", style: "station" as const },
  {
    id: "airport",
    label: "Flughafen",
    phrase: "Der Flughafen",
    style: "airport" as const,
  },
] as const;

export default function App() {
  const { width, height } = useWindowDimensions();
  const [selectedLabel, setSelectedLabel] = useState("Tippe auf ein Fahrzeug");
  const [successMessage, setSuccessMessage] = useState("");
  const [highlightedZoneId, setHighlightedZoneId] = useState<ZoneId | null>(null);
  const [zoneBurstId, setZoneBurstId] = useState<ZoneId | null>(null);
  const [isFreePlayMode, setIsFreePlayMode] = useState(true);
  const [isGameMode, setIsGameMode] = useState(false);
  const [isFindGameModalVisible, setIsFindGameModalVisible] = useState(false);
  const [findGameHelperText, setFindGameHelperText] = useState(
    "Höre zu und tippe danach auf das richtige Fahrzeug.",
  );
  const [findGameActionLabel, setFindGameActionLabel] = useState("Los geht's");
  const [showParentSettings, setShowParentSettings] = useState(false);
  const [speechOn, setSpeechOnState] = useState(true);
  const [soundsOn, setSoundsOnState] = useState(true);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [resetTrigger, setResetTrigger] = useState(0);
  const [gamePrompt, setGamePrompt] = useState("Drücke Start");
  const [gameFeedback, setGameFeedback] = useState("");
  const [targetVehicleId, setTargetVehicleId] = useState<VehicleId | null>(null);
  const [tapTokens, setTapTokens] = useState<VehicleTokenMap>(EMPTY_TOKENS);
  const [celebrationTokens, setCelebrationTokens] = useState<VehicleTokenMap>(EMPTY_TOKENS);
  const [incorrectDropTokens, setIncorrectDropTokens] = useState<VehicleTokenMap>(EMPTY_TOKENS);
  const sparkleScale = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const zoneBurstScale = useRef(new Animated.Value(0.7)).current;
  const zoneBurstOpacity = useRef(new Animated.Value(0)).current;
  const nextRoundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zones = useMemo<Record<ZoneId, ZoneLayout>>(() => {
    const safeWidth = Math.max(width, 360);
    const safeHeight = Math.max(height, 720);

    return {
      sky: {
        id: "sky",
        title: "Himmel",
        x: 16,
        y: 138,
        width: safeWidth - 32,
        height: safeHeight * 0.22,
        color: "#cbefff",
      },
      road: {
        id: "road",
        title: "Straße",
        x: 16,
        y: safeHeight * 0.58,
        width: safeWidth - 32,
        height: safeHeight * 0.14,
        color: "#f8d88a",
      },
      track: {
        id: "track",
        title: "Schiene",
        x: 16,
        y: safeHeight * 0.77,
        width: safeWidth - 32,
        height: safeHeight * 0.11,
        color: "#ffc4bf",
      },
    };
  }, [height, width]);

  const homes = useMemo<VehicleHomeMap>(() => {
    const safeWidth = Math.max(width, 360);
    const vehicleSize = 124;
    const rowY = zones.sky.y - 8;
    const gap = Math.max(16, (safeWidth - 48 - vehicleSize * 3) / 2);

    return {
      bus: { x: 16, y: rowY },
      plane: { x: 16 + vehicleSize + gap, y: rowY - 4 },
      train: { x: safeWidth - vehicleSize - 16, y: rowY },
    };
  }, [width, zones]);

  useEffect(() => {
    void initializeSoundEffects();

    return () => {
      if (nextRoundTimeoutRef.current) {
        clearTimeout(nextRoundTimeoutRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      clearInteractionQueue();
      stopAllSoundEffects();
      releaseSoundEffects();
      void stopGermanSpeech();
    };
  }, []);

  useEffect(() => {
    void setSpeechEnabled(speechOn);
  }, [speechOn]);

  useEffect(() => {
    setSoundEnabled(soundsOn);
  }, [soundsOn]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage("");
    }, INTERACTION_TIMING.feedback.successBubbleDurationMs);

    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [successMessage]);

  function handleTap(vehicle: VehicleDefinition) {
    if (isFindGameModalVisible) {
      return;
    }

    setSelectedLabel(vehicle.label);
    bumpVehicleToken(setTapTokens, vehicle.id);

    if (isGameMode) {
      void handleGameTap(vehicle);
      return;
    }

    queueTapFeedback({
      vehicleId: vehicle.id,
      speech: getTapSpeech(vehicle),
      soundDelayMs: INTERACTION_TIMING.tap.soundDelayMs,
      speechDelayMs: INTERACTION_TIMING.tap.speechDelayMs,
    });
  }

  async function handleGameTap(vehicle: VehicleDefinition) {
    if (vehicle.id === targetVehicleId) {
      handleCorrectDrop(vehicle);

      if (nextRoundTimeoutRef.current) {
        clearTimeout(nextRoundTimeoutRef.current);
      }

      nextRoundTimeoutRef.current = setTimeout(() => {
        void askNextQuestion(vehicle.id, {
          openModal: true,
          helperText: "Super! Höre die nächste Frage.",
          actionLabel: "Weiter",
        });
      }, INTERACTION_TIMING.game.nextPromptDelayMs);
      return;
    }

    setGameFeedback("Nochmal");
    queueIncorrectDropSpeech("Nochmal", INTERACTION_TIMING.wrongDrop.speechDelayMs);
    openFindGameModal({
      helperText: "Versuch es nochmal und tippe auf das richtige Fahrzeug.",
      actionLabel: "Nochmal hören",
    });
  }

  function handleCorrectDrop(vehicle: VehicleDefinition) {
    setSelectedLabel(vehicle.label);
    setHighlightedZoneId(vehicle.preferredZone);
    setGameFeedback((current) => (isGameMode ? "Super!" : current));

    queueCorrectDropFeedback({
      speech: vehicle.speechName,
      soundDelayMs: INTERACTION_TIMING.correctDrop.soundDelayMs,
      speechDelayMs: INTERACTION_TIMING.correctDrop.speechDelayMs,
      extraOneDelayMs: INTERACTION_TIMING.correctDrop.celebrationDelayMs,
      onExtraOne: () => {
        bumpVehicleToken(setCelebrationTokens, vehicle.id);
        playSparkle();
        playZoneBurst(vehicle.preferredZone);
      },
      extraTwoDelayMs: INTERACTION_TIMING.completion.successDelayMs,
      onExtraTwo: () => {
        setSuccessMessage("Super!");
      },
      extraThreeDelayMs: INTERACTION_TIMING.completion.speechDelayMs,
      onExtraThree: () => {
        void speakGerman(getCompletionSpeech(vehicle));
      },
    });
  }

  function handleIncorrectDrop(vehicle: VehicleDefinition) {
    bumpVehicleToken(setIncorrectDropTokens, vehicle.id);
    queueIncorrectDropSpeech("Nochmal", INTERACTION_TIMING.wrongDrop.speechDelayMs);
  }

  function handleDragUpdate(
    vehicle: VehicleDefinition,
    update: { isDragging: boolean; isNearPreferredZone: boolean },
  ) {
    if (!update.isDragging) {
      setHighlightedZoneId((current) =>
        current === vehicle.preferredZone ? null : current,
      );
      return;
    }

    setHighlightedZoneId(update.isNearPreferredZone ? vehicle.preferredZone : null);
  }

  function handleSceneWordTap(label: string, phrase?: string) {
    if (!isFreePlayMode || isGameMode) {
      return;
    }

    setSelectedLabel(label);
    clearInteractionQueue();
    setTimeout(() => {
      void speakGerman(phrase ?? label);
    }, INTERACTION_TIMING.tap.speechDelayMs);
  }

  function getTapSpeech(vehicle: VehicleDefinition) {
    if (difficulty === "easy") {
      return vehicle.speechName;
    }

    return `${vehicle.speechName}. ${vehicle.phrase}`;
  }

  function getCompletionSpeech(vehicle: VehicleDefinition) {
    if (vehicle.id === "bus") {
      return "Der Bus ist fertig";
    }

    if (vehicle.id === "plane") {
      return "Das Flugzeug ist fertig";
    }

    return "Der Zug ist fertig";
  }

  function clearGameRound() {
    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }

    setIsGameMode(false);
    setIsFindGameModalVisible(false);
    setGamePrompt("Drücke Start");
    setGameFeedback("");
    setTargetVehicleId(null);
  }

  function playSparkle() {
    sparkleScale.setValue(0.5);
    sparkleOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(sparkleScale, {
          toValue: 1.2,
          useNativeDriver: true,
          speed: 18,
          bounciness: 10,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(sparkleScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 16,
          bounciness: 8,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }

  function playZoneBurst(zoneId: ZoneId) {
    setZoneBurstId(zoneId);
    zoneBurstScale.setValue(0.7);
    zoneBurstOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(zoneBurstScale, {
          toValue: 1.08,
          useNativeDriver: true,
          speed: 18,
          bounciness: 8,
        }),
        Animated.timing(zoneBurstOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(zoneBurstOpacity, {
          toValue: 0,
          duration: INTERACTION_TIMING.feedback.starBurstDurationMs,
          useNativeDriver: true,
        }),
        Animated.spring(zoneBurstScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 16,
          bounciness: 6,
        }),
      ]),
    ]).start(() => {
      setZoneBurstId(null);
      setHighlightedZoneId(null);
    });
  }

  function startFindGame() {
    setIsFreePlayMode(false);
    setIsGameMode(true);
    setGameFeedback("");
    void askNextQuestion(undefined, {
      openModal: true,
      helperText: "Höre zu und tippe danach auf das richtige Fahrzeug.",
      actionLabel: "Los geht's",
    });
  }

  function startFreePlay() {
    clearGameRound();
    setIsFreePlayMode(true);
    setSelectedLabel("Freies Spiel");
    clearInteractionQueue();
    stopAllSoundEffects();
    void stopGermanSpeech();
  }

  function closeFindGame() {
    startFreePlay();
  }

  function resetVehiclesToDefault() {
    setHighlightedZoneId(null);
    setZoneBurstId(null);
    setResetTrigger((current) => current + 1);
  }

  async function askNextQuestion(
    previousVehicleId?: VehicleId,
    modalOptions?: {
      openModal?: boolean;
      helperText?: string;
      actionLabel?: string;
    },
  ) {
    const nextVehicle = pickNextVehicle(previousVehicleId);
    const nextPrompt = getGamePrompt(nextVehicle);
    setTargetVehicleId(nextVehicle.id);
    setGameFeedback("");
    setGamePrompt(nextPrompt);
    if (modalOptions?.openModal) {
      openFindGameModal({
        helperText: modalOptions.helperText,
        actionLabel: modalOptions.actionLabel,
      });
    }
    clearInteractionQueue();
    await speakGerman(nextPrompt);
  }

  function openFindGameModal(options?: {
    helperText?: string;
    actionLabel?: string;
  }) {
    setFindGameHelperText(
      options?.helperText ?? "Höre zu und tippe danach auf das richtige Fahrzeug.",
    );
    setFindGameActionLabel(options?.actionLabel ?? "Los geht's");
    setIsFindGameModalVisible(true);
  }

  function handleFindGameModalAction() {
    setIsFindGameModalVisible(false);

    if (findGameActionLabel === "Nochmal hören" && gamePrompt) {
      clearInteractionQueue();
      void speakGerman(gamePrompt);
    }
  }

  function getGamePrompt(vehicle: VehicleDefinition) {
    if (difficulty !== "advanced" || !vehicle.advancedPrompts?.length) {
      return vehicle.questionPrompt;
    }

    const promptIndex = Math.floor(Math.random() * vehicle.advancedPrompts.length);
    return vehicle.advancedPrompts[promptIndex];
  }

  function pickNextVehicle(previousVehicleId?: VehicleId) {
    const candidates = VEHICLES.filter((vehicle) => vehicle.id !== previousVehicleId);
    const pool = candidates.length > 0 ? candidates : VEHICLES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function toggleSpeech() {
    setSpeechOnState((current) => !current);
  }

  function toggleSounds() {
    setSoundsOnState((current) => !current);
  }

  const zoneBurstStyle = zoneBurstId
    ? {
        left: zones[zoneBurstId].x + zones[zoneBurstId].width / 2 - 36,
        top: zones[zoneBurstId].y + zones[zoneBurstId].height / 2 - 24,
      }
    : null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.container}>
        <Pressable
          delayLongPress={700}
          onLongPress={() => setShowParentSettings(true)}
          style={styles.parentIconButton}
        >
          <Text style={styles.parentIconText}>👪</Text>
        </Pressable>

        {SCENE_ITEMS.map((item) => (
          <SceneWordButton
            key={item.id}
            disabled={!isFreePlayMode || isGameMode || isFindGameModalVisible}
            onPress={() => handleSceneWordTap(item.label, item.phrase)}
            style={styles[item.style]}
          >
            {item.style === "cloudOne" || item.style === "cloudTwo" ? (
              <>
                <View style={styles.cloudPuffLeft} />
                <View style={styles.cloudPuffMiddle} />
                <View style={styles.cloudPuffRight} />
              </>
            ) : null}
            {item.style === "sun" ? <View style={styles.sunInner} /> : null}
            {item.style === "station" ? (
              <>
                <Text style={styles.sceneEmoji}>🚉</Text>
                <Text style={styles.sceneLabel}>Bahnhof</Text>
              </>
            ) : null}
            {item.style === "airport" ? (
              <>
                <Text style={styles.sceneEmoji}>🛫</Text>
                <Text style={styles.sceneLabel}>Flughafen</Text>
              </>
            ) : null}
          </SceneWordButton>
        ))}

        <View style={styles.headerWrap}>
          <Text style={styles.eyebrow}>Spielen und Sprechen</Text>
          <Text style={styles.title}>Transport Deutsch</Text>
        </View>
        <Text style={styles.subtitle}>{selectedLabel}</Text>

        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, isFreePlayMode ? styles.modeButtonActive : null]}
            onPress={startFreePlay}
          >
            <Text style={styles.modeButtonText}>Free Play</Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, isGameMode ? styles.modeButtonActive : null]}
            onPress={startFindGame}
          >
            <Text style={styles.modeButtonText}>Find Game</Text>
          </Pressable>
        </View>

        <View style={styles.modeHintBubble}>
          <Text style={styles.modeHintText}>
            {isGameMode ? MODE_HINTS.game : MODE_HINTS.freePlay}
          </Text>
        </View>

        {successMessage ? (
          <View style={styles.successBubble}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <Animated.View
          pointerEvents="none"
          style={[
            styles.sparkleBurst,
            {
              opacity: sparkleOpacity,
              transform: [{ scale: sparkleScale }],
            },
          ]}
        >
          <Text style={styles.sparkleText}>✨</Text>
          <Text style={styles.sparkleText}>⭐</Text>
          <Text style={styles.sparkleText}>✨</Text>
        </Animated.View>

        {Object.values(zones).map((zone) => (
          <DropZone
            key={zone.id}
            zone={zone}
            isHighlighted={highlightedZoneId === zone.id}
          />
        ))}

        {zoneBurstId && zoneBurstStyle ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.zoneBurst,
              zoneBurstStyle,
              {
                opacity: zoneBurstOpacity,
                transform: [{ scale: zoneBurstScale }],
              },
            ]}
          >
            <Text style={styles.zoneBurstText}>⭐</Text>
            <Text style={styles.zoneBurstText}>✨</Text>
            <Text style={styles.zoneBurstText}>⭐</Text>
          </Animated.View>
        ) : null}

        <View style={[styles.roadStripe, { top: zones.road.y + 34 }]} />
        <View style={[styles.roadStripe, { top: zones.road.y + 74 }]} />
        <View style={[styles.trackLine, { top: zones.track.y + 20 }]} />
        <View style={[styles.trackLine, { top: zones.track.y + 72 }]} />
        <View style={[styles.trackTieRow, { top: zones.track.y + 24 }]} />

        {VEHICLES.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            home={homes[vehicle.id]}
            zones={zones}
            resetTrigger={resetTrigger}
            interactionEnabled={!isFindGameModalVisible}
            tapAnimationToken={tapTokens[vehicle.id]}
            celebrationToken={celebrationTokens[vehicle.id]}
            incorrectDropToken={incorrectDropTokens[vehicle.id]}
            onTap={handleTap}
            onMatch={handleCorrectDrop}
            onIncorrectDrop={handleIncorrectDrop}
            onDragUpdate={handleDragUpdate}
          />
        ))}

        <View pointerEvents="none" style={styles.footerBubble}>
          <Text style={styles.footerText}>Tippe oder ziehe und lerne.</Text>
        </View>

        <FindGameModal
          visible={isGameMode && isFindGameModalVisible}
          promptText={gamePrompt}
          helperText={findGameHelperText}
          actionLabel={findGameActionLabel}
          onClose={closeFindGame}
          onRetry={handleFindGameModalAction}
        />

        {showParentSettings ? (
          <View style={styles.parentOverlay}>
            <View style={styles.parentCard}>
              <Text style={styles.parentTitle}>Parent Settings</Text>
              <Text style={styles.parentHint}>Long-press the corner icon to open.</Text>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Speech</Text>
                <Pressable
                  style={[styles.toggleButton, speechOn ? styles.toggleOn : styles.toggleOff]}
                  onPress={toggleSpeech}
                >
                  <Text style={styles.toggleText}>{speechOn ? "On" : "Off"}</Text>
                </Pressable>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Sounds</Text>
                <Pressable
                  style={[styles.toggleButton, soundsOn ? styles.toggleOn : styles.toggleOff]}
                  onPress={toggleSounds}
                >
                  <Text style={styles.toggleText}>{soundsOn ? "On" : "Off"}</Text>
                </Pressable>
              </View>

              <Text style={styles.settingSectionTitle}>Difficulty</Text>
              <View style={styles.difficultyRow}>
                {(["easy", "medium", "advanced"] as DifficultyLevel[]).map((level) => (
                  <Pressable
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty === level ? styles.difficultyButtonActive : null,
                    ]}
                    onPress={() => setDifficulty(level)}
                  >
                    <Text style={styles.difficultyLabel}>
                      {level === "easy"
                        ? "Easy"
                        : level === "medium"
                          ? "Medium"
                          : "Advanced"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.difficultyHint}>{DIFFICULTY_DETAILS[difficulty]}</Text>

              <Pressable style={styles.resetButton} onPress={resetVehiclesToDefault}>
                <Text style={styles.resetButtonText}>Reset Vehicles</Text>
              </Pressable>

              <Pressable
                style={styles.closeParentButton}
                onPress={() => setShowParentSettings(false)}
              >
                <Text style={styles.closeParentButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function bumpVehicleToken(
  setter: React.Dispatch<React.SetStateAction<VehicleTokenMap>>,
  vehicleId: VehicleId,
) {
  setter((current) => ({
    ...current,
    [vehicleId]: current[vehicleId] + 1,
  }));
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

function createTextGlow(color: string, offsetY: number, radius: number) {
  if (Platform.OS === "web") {
    return {
      textShadow: `0px ${offsetY}px ${radius}px ${color}`,
    } as const;
  }

  return {
    textShadowColor: color,
    textShadowOffset: { width: 0, height: offsetY },
    textShadowRadius: radius,
  } as const;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => value + value)
          .join("")
      : normalized;

  const intValue = Number.parseInt(expanded, 16);
  const red = (intValue >> 16) & 255;
  const green = (intValue >> 8) & 255;
  const blue = intValue & 255;

  return `${red}, ${green}, ${blue}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#9edcff",
  },
  container: {
    flex: 1,
    backgroundColor: "#9edcff",
  },
  parentIconButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 40,
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    alignItems: "center",
    justifyContent: "center",
    ...createSurfaceShadow("#3d7ca8", 0.16, 8, 4, 4),
  },
  parentIconText: {
    fontSize: 18,
  },
  headerWrap: {
    marginTop: 22,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  eyebrow: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "800",
    color: "#3d6b87",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 36,
    fontWeight: "900",
    color: "#13415c",
  },
  subtitle: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 30,
    fontWeight: "800",
    color: "#ffffff",
    paddingHorizontal: 24,
    ...createTextGlow("rgba(18, 62, 86, 0.18)", 2, 6),
  },
  modeRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 18,
  },
  modeButton: {
    minWidth: 154,
    minHeight: 66,
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    ...createSurfaceShadow("#477ca0", 0.16, 10, 5, 4),
  },
  modeButtonActive: {
    backgroundColor: "#ff966f",
  },
  modeButtonText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#17425d",
  },
  modeHintBubble: {
    alignSelf: "center",
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.88)",
    ...createSurfaceShadow("#477ca0", 0.1, 8, 4, 2),
  },
  modeHintText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0b2942",
    textAlign: "center",
  },
  successBubble: {
    alignSelf: "center",
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#fff9ee",
    ...createSurfaceShadow("#c77b63", 0.12, 10, 5, 3),
  },
  successText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ff7058",
  },
  sparkleBurst: {
    position: "absolute",
    top: 182,
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
  },
  sparkleText: {
    fontSize: 34,
  },
  zoneBurst: {
    position: "absolute",
    width: 72,
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  zoneBurstText: {
    fontSize: 26,
  },
  cloudOne: {
    position: "absolute",
    top: 68,
    left: 22,
    width: 124,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  cloudTwo: {
    position: "absolute",
    top: 96,
    right: 28,
    width: 144,
    height: 62,
    justifyContent: "center",
    alignItems: "center",
  },
  cloudPuffLeft: {
    position: "absolute",
    left: 6,
    top: 18,
    width: 42,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  cloudPuffMiddle: {
    position: "absolute",
    top: 8,
    width: 56,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  cloudPuffRight: {
    position: "absolute",
    right: 6,
    top: 16,
    width: 44,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  sun: {
    position: "absolute",
    top: 56,
    right: 34,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#ffd97b",
    justifyContent: "center",
    alignItems: "center",
    ...createSurfaceShadow("#ffd97b", 0.34, 16, 6, 5),
  },
  sunInner: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  station: {
    position: "absolute",
    left: 18,
    bottom: 124,
    width: 132,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#fff8df",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    ...createSurfaceShadow("#5d7990", 0.12, 10, 5, 3),
  },
  airport: {
    position: "absolute",
    right: 18,
    bottom: 124,
    width: 146,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#e5f5ff",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    ...createSurfaceShadow("#5d7990", 0.12, 10, 5, 3),
  },
  sceneEmoji: {
    fontSize: 28,
  },
  sceneLabel: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "800",
    color: "#2f4d62",
  },
  roadStripe: {
    position: "absolute",
    left: 36,
    right: 36,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  trackLine: {
    position: "absolute",
    left: 24,
    right: 24,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#715038",
  },
  trackTieRow: {
    position: "absolute",
    left: 24,
    right: 24,
    height: 56,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderColor: "transparent",
    borderStyle: "dashed",
    opacity: 0.35,
  },
  footerBubble: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 16,
    ...createSurfaceShadow("#4b7b9c", 0.1, 10, 5, 3),
  },
  footerText: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: "#20455f",
  },
  gameOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 110,
  },
  gameCard: {
    width: "100%",
    maxWidth: 390,
    minHeight: 248,
    borderRadius: 32,
    backgroundColor: "rgba(255,252,247,0.98)",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
    ...createSurfaceShadow("#103554", 0.16, 18, 10, 7),
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    minWidth: 112,
    minHeight: 48,
    backgroundColor: "#dff2ff",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#215170",
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1d425c",
  },
  gamePrompt: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 34,
    fontWeight: "900",
    color: "#ff7d62",
  },
  gameHint: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#41657d",
  },
  gameFeedbackBubble: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#fff0b3",
  },
  gameFeedbackText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0b2942",
  },
  parentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 22, 36, 0.48)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 50,
  },
  parentCard: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 30,
    backgroundColor: "#fffdf9",
    borderWidth: 3,
    borderColor: "#6a8295",
    paddingHorizontal: 22,
    paddingVertical: 24,
    ...createSurfaceShadow("#21384a", 0.18, 18, 10, 8),
  },
  parentTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#23384d",
    textAlign: "center",
  },
  parentHint: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#5b6f82",
    textAlign: "center",
  },
  settingRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: "#23384d",
  },
  toggleButton: {
    minWidth: 92,
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: "#5dbb63",
  },
  toggleOff: {
    backgroundColor: "#9ca8b3",
  },
  toggleText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
  },
  settingSectionTitle: {
    marginTop: 22,
    fontSize: 20,
    fontWeight: "800",
    color: "#23384d",
  },
  difficultyRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: "#dfe7ef",
    borderRadius: 20,
    minHeight: 56,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  difficultyButtonActive: {
    backgroundColor: "#7cc8ff",
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1d3448",
  },
  difficultyHint: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#5b6f82",
  },
  resetButton: {
    marginTop: 22,
    backgroundColor: "#ffb347",
    borderRadius: 20,
    minHeight: 56,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
  },
  closeParentButton: {
    marginTop: 12,
    backgroundColor: "#3e5871",
    borderRadius: 20,
    minHeight: 56,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  closeParentButtonText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
  },
});
