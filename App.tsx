import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { FindGameModal } from "./src/components/FindGameModal";
import { ItemCard } from "./src/components/ItemCard";
import { SceneWordButton } from "./src/components/SceneWordButton";
import {
  getEnglishMeaningForItem,
  getItemsForBook,
  getPictureBookById,
  ITEMS,
  PICTURE_BOOKS,
} from "./src/data/items";
import { setSpeechEnabled, speakGerman, stopGermanSpeech } from "./src/utils/audio";
import {
  clearInteractionQueue,
  queueCorrectSelectionFeedback,
  queueIncorrectSelectionSpeech,
  queueTapFeedback,
} from "./src/utils/interactionCoordinator";
import { INTERACTION_TIMING } from "./src/utils/interactionTiming";
import {
  initializeSoundEffects,
  releaseSoundEffects,
  setBackgroundMusicVolume,
  setSoundEnabled,
  startBackgroundMusic,
  stopAllSoundEffects,
  stopBackgroundMusic,
} from "./src/utils/soundEffects";
import {
  BookId,
  DifficultyLevel,
  ItemDefinition,
  ItemId,
  PictureBookDefinition,
} from "./types";

type ItemHomeMap = Record<ItemId, { x: number; y: number }>;
type ItemTokenMap = Record<ItemId, number>;

const DIFFICULTY_DETAILS: Record<DifficultyLevel, string> = {
  easy: "Kurze Namen zum Mitsprechen.",
  medium: "Namen und einfache Sätze.",
  advanced: "Gemischte Fragen im Suchspiel.",
};

const SCENE_ITEMS = [
  {
    id: "cloud-left",
    label: "Wolke",
    phrase: "Die Wolke",
    style: "cloudOne" as const,
    reaction: "cloud" as const,
  },
  {
    id: "cloud-right",
    label: "Wolke",
    phrase: "Die Wolke",
    style: "cloudTwo" as const,
    reaction: "cloud" as const,
  },
  { id: "sun", label: "Sonne", phrase: "Die Sonne", style: "sun" as const, reaction: "sun" as const },
  {
    id: "station",
    label: "Bahnhof",
    phrase: "Der Bahnhof",
    style: "station" as const,
    reaction: "station" as const,
  },
  {
    id: "airport",
    label: "Flughafen",
    phrase: "Der Flughafen",
    style: "airport" as const,
    reaction: "airport" as const,
  },
] as const;

const ITEMS_PER_PAGE = 3;
const INITIAL_VISIBLE_ITEMS = createOrderedItemSetForBook("transport", 0);
const PRAISE_MESSAGES = [
  "Ja, genau!",
  "Wunderbar!",
  "Ganz toll!",
  "Geschafft!",
  "Wie schön!",
] as const;
const QUESTION_MODAL_AUTO_CLOSE_MS = 2600;
const MUSIC_VOLUME_STEPS = [0, 0.08, 0.14, 0.2, 0.28] as const;

export default function App() {
  const { width, height } = useWindowDimensions();
  const [visibleItems, setVisibleItems] = useState<ItemDefinition[]>(INITIAL_VISIBLE_ITEMS);
  const [pageHistory, setPageHistory] = useState<ItemDefinition[][]>([INITIAL_VISIBLE_ITEMS]);
  const [pageHistoryIndex, setPageHistoryIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [wrongMessage, setWrongMessage] = useState("");
  const [activeBookId, setActiveBookId] = useState<BookId>("transport");
  const [previewBookIndex, setPreviewBookIndex] = useState(() =>
    PICTURE_BOOKS.findIndex((book) => book.id === "transport"),
  );
  const [isFreePlayMode, setIsFreePlayMode] = useState(true);
  const [isGameMode, setIsGameMode] = useState(false);
  const [isFindGameModalVisible, setIsFindGameModalVisible] = useState(false);
  const [findGameHelperText, setFindGameHelperText] = useState(
    "Höre zu und tippe danach auf das richtige Bild.",
  );
  const [findGameActionLabel, setFindGameActionLabel] = useState("Los!");
  const [showParentSettings, setShowParentSettings] = useState(false);
  const [speechOn, setSpeechOnState] = useState(true);
  const [soundsOn, setSoundsOnState] = useState(true);
  const [musicVolume, setMusicVolume] = useState<number>(0.14);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("easy");
  const [resetTrigger, setResetTrigger] = useState(0);
  const [gamePrompt, setGamePrompt] = useState("Tippe auf Start");
  const [targetItemId, setTargetItemId] = useState<ItemId | null>(null);
  const [previewedItem, setPreviewedItem] = useState<ItemDefinition | null>(null);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const [bookTurnDirection, setBookTurnDirection] = useState<1 | -1>(1);
  const [tapTokens, setTapTokens] = useState<ItemTokenMap>(() => createItemTokenMap());
  const [celebrationTokens, setCelebrationTokens] = useState<ItemTokenMap>(() =>
    createItemTokenMap(),
  );
  const [wrongTapTokens, setWrongTapTokens] = useState<ItemTokenMap>(() =>
    createItemTokenMap(),
  );
  const sparkleScale = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const previewScale = useRef(new Animated.Value(0.88)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;
  const bookCoverTurn = useRef(new Animated.Value(0)).current;
  const bookCoverLift = useRef(new Animated.Value(0)).current;
  const bookCoverSheen = useRef(new Animated.Value(0)).current;
  const birdDriftOne = useRef(new Animated.Value(0)).current;
  const birdDriftTwo = useRef(new Animated.Value(0)).current;
  const flowerBobLeft = useRef(new Animated.Value(0)).current;
  const flowerBobRight = useRef(new Animated.Value(0)).current;
  const pageTurnProgress = useRef(new Animated.Value(0)).current;
  const nextRoundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalAutoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layout = useMemo(() => {
    const safeWidth = Math.max(width, 360);
    const safeHeight = Math.max(height, 720);
    const desiredGap = Math.max(8, Math.min(16, Math.floor(safeWidth * 0.028)));
    const cardWidth = Math.min(
      150,
      Math.max(102, Math.floor((safeWidth - 28 - desiredGap * 2) / 3)),
    );
    const cardHeight = Math.min(208, Math.max(144, Math.floor(cardWidth * 1.36)));
    const cardRowY = Math.max(240, Math.min(322, safeHeight * 0.36));
    const gap = Math.max(6, Math.floor((safeWidth - 28 - cardWidth * 3) / 2));

    return {
      safeWidth,
      safeHeight,
      cardWidth,
      cardHeight,
      cardRowY,
      gap,
      bookChooserWidth: Math.min(250, safeWidth - 96),
    };
  }, [height, width]);

  const homes = useMemo<ItemHomeMap>(() => {
    const slots = [
      { x: 14, y: layout.cardRowY + 14 },
      { x: 14 + layout.cardWidth + layout.gap, y: layout.cardRowY - 6 },
      { x: layout.safeWidth - layout.cardWidth - 14, y: layout.cardRowY + 10 },
    ];
    const nextHomes: ItemHomeMap = {};

    visibleItems.forEach((item, index) => {
      nextHomes[item.id] = slots[index];
    });

    return nextHomes;
  }, [layout, visibleItems]);
  const isCompactPhone = width <= 430 || height <= 780;
  const visibleSceneItems = isCompactPhone
    ? SCENE_ITEMS.filter((item) => item.id !== "station" && item.id !== "airport")
    : SCENE_ITEMS;
  const previewBook = PICTURE_BOOKS[previewBookIndex] ?? PICTURE_BOOKS[0];
  const activeBook = getPictureBookById(activeBookId) ?? PICTURE_BOOKS[0];
  const totalPageCount = Math.max(
    1,
    Math.ceil(getItemsForBook(activeBookId).length / ITEMS_PER_PAGE),
  );
  const isLastPageInBook = pageHistoryIndex >= totalPageCount - 1;

  useEffect(() => {
    void initializeSoundEffects();

    return () => {
      if (nextRoundTimeoutRef.current) {
        clearTimeout(nextRoundTimeoutRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (modalAutoCloseTimeoutRef.current) {
        clearTimeout(modalAutoCloseTimeoutRef.current);
      }
      if (wrongMessageTimeoutRef.current) {
        clearTimeout(wrongMessageTimeoutRef.current);
      }
      clearInteractionQueue();
      stopAllSoundEffects();
      stopBackgroundMusic();
      releaseSoundEffects();
      void stopGermanSpeech();
    };
  }, []);

  useEffect(() => {
    void setSpeechEnabled(speechOn);
  }, [speechOn]);

  useEffect(() => {
    setSoundEnabled(soundsOn);

    if (soundsOn) {
      void startBackgroundMusic();
      return;
    }

    stopBackgroundMusic();
  }, [soundsOn]);

  useEffect(() => {
    setBackgroundMusicVolume(musicVolume);
  }, [musicVolume]);

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

  useEffect(() => {
    if (!wrongMessage) {
      return;
    }

    wrongMessageTimeoutRef.current = setTimeout(() => {
      setWrongMessage("");
    }, 1300);

    return () => {
      if (wrongMessageTimeoutRef.current) {
        clearTimeout(wrongMessageTimeoutRef.current);
      }
    };
  }, [wrongMessage]);

  useEffect(() => {
    if (!isGameMode || !gamePrompt) {
      return;
    }

    clearInteractionQueue();
    void speakGerman(gamePrompt);
  }, [gamePrompt, isGameMode]);

  useEffect(() => {
    if (!isFindGameModalVisible) {
      if (modalAutoCloseTimeoutRef.current) {
        clearTimeout(modalAutoCloseTimeoutRef.current);
      }
      return;
    }

    modalAutoCloseTimeoutRef.current = setTimeout(() => {
      setIsFindGameModalVisible(false);
    }, QUESTION_MODAL_AUTO_CLOSE_MS);

    return () => {
      if (modalAutoCloseTimeoutRef.current) {
        clearTimeout(modalAutoCloseTimeoutRef.current);
      }
    };
  }, [findGameActionLabel, gamePrompt, isFindGameModalVisible]);

  useEffect(() => {
    const birdOneLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(birdDriftOne, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(birdDriftOne, {
          toValue: 0,
          duration: 3200,
          useNativeDriver: true,
        }),
      ]),
    );
    const birdTwoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(birdDriftTwo, {
          toValue: 1,
          duration: 3800,
          useNativeDriver: true,
        }),
        Animated.timing(birdDriftTwo, {
          toValue: 0,
          duration: 3800,
          useNativeDriver: true,
        }),
      ]),
    );
    const flowerLeftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flowerBobLeft, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(flowerBobLeft, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );
    const flowerRightLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flowerBobRight, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(flowerBobRight, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: true,
        }),
      ]),
    );

    birdOneLoop.start();
    birdTwoLoop.start();
    flowerLeftLoop.start();
    flowerRightLoop.start();

    return () => {
      birdOneLoop.stop();
      birdTwoLoop.stop();
      flowerLeftLoop.stop();
      flowerRightLoop.stop();
    };
  }, [birdDriftOne, birdDriftTwo, flowerBobLeft, flowerBobRight]);

  function handleTap(item: ItemDefinition) {
    if (isFindGameModalVisible) {
      return;
    }

    bumpItemToken(setTapTokens, item.id);

    if (isGameMode) {
      void handleGameTap(item);
      return;
    }

    queueTapFeedback({
      itemId: item.id,
      speech: getTapSpeech(item),
      soundDelayMs: INTERACTION_TIMING.tap.soundDelayMs,
      speechDelayMs: INTERACTION_TIMING.tap.speechDelayMs,
    });
  }

  function handleItemLongPress(item: ItemDefinition) {
    if (isFindGameModalVisible || showParentSettings) {
      return;
    }

    previewScale.setValue(0.88);
    previewOpacity.setValue(0);
    setPreviewedItem(item);
    clearInteractionQueue();
    void speakGerman(item.speechName);
    Animated.parallel([
      Animated.spring(previewScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 10,
      }),
      Animated.timing(previewOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }

  async function handleGameTap(item: ItemDefinition) {
    if (item.id === targetItemId) {
      handleCorrectSelection(item);
      return;
    }

    handleIncorrectSelectionFeedback(item);
    queueIncorrectSelectionSpeech(
      "Probier ein anderes!",
      INTERACTION_TIMING.wrongSelection.speechDelayMs,
    );
  }

  function handleCorrectSelection(item: ItemDefinition) {
    handleCorrectSelectionFeedback(item);

    if (isGameMode) {
      if (nextRoundTimeoutRef.current) {
        clearTimeout(nextRoundTimeoutRef.current);
      }

      nextRoundTimeoutRef.current = setTimeout(() => {
        void askNextQuestion(item.id, {
          openModal: false,
          helperText: "Super! Höre die nächste Frage.",
          actionLabel: "Weiter",
        });
      }, INTERACTION_TIMING.game.nextPromptDelayMs);
    }
  }

  function handleCorrectSelectionFeedback(item: ItemDefinition) {
    const praise = pickPraiseMessage();
    const celebrationAnnouncement = `${praise} ${item.speechName}`;

    queueCorrectSelectionFeedback({
      speech: celebrationAnnouncement,
      soundDelayMs: INTERACTION_TIMING.correctSelection.soundDelayMs,
      speechDelayMs: INTERACTION_TIMING.correctSelection.speechDelayMs,
      extraOneDelayMs: INTERACTION_TIMING.correctSelection.celebrationDelayMs,
      onExtraOne: () => {
        bumpItemToken(setCelebrationTokens, item.id);
        playSparkle();
      },
      extraTwoDelayMs: INTERACTION_TIMING.completion.successDelayMs,
      onExtraTwo: () => {
        setSuccessMessage(`${praise} ${item.label}`);
      },
    });
  }

  function handleIncorrectSelectionFeedback(item: ItemDefinition) {
    bumpItemToken(setWrongTapTokens, item.id);
    setWrongMessage("Probier ein anderes!");
  }

  function handleSceneWordTap(label: string, phrase?: string) {
    if (!isFreePlayMode || isGameMode) {
      return;
    }

    clearInteractionQueue();
    setTimeout(() => {
      void speakGerman(phrase ?? label);
    }, INTERACTION_TIMING.tap.speechDelayMs);
  }

  function getTapSpeech(item: ItemDefinition) {
    if (difficulty === "easy") {
      return item.speechName;
    }

    return `${item.speechName}. ${item.phrase}`;
  }

  function clearGameRound() {
    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }

    setIsGameMode(false);
    setIsFindGameModalVisible(false);
    setGamePrompt("Tippe auf Start");
    setTargetItemId(null);
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

  function startFindGame() {
    setIsFreePlayMode(false);
    setIsGameMode(true);
    void askNextQuestion(undefined, {
      openModal: true,
      helperText: "Höre zu und tippe dann auf das passende Bild in unserem kleinen Buch.",
      actionLabel: "Starten",
    });
  }

  function startFreePlay() {
    clearGameRound();
    setIsFreePlayMode(true);
    const nextItems = createOrderedItemSetForBook(activeBookId, 0);
    transitionToItems(nextItems);
    setPageHistory([nextItems]);
    setPageHistoryIndex(0);
    clearInteractionQueue();
    stopAllSoundEffects();
    void stopGermanSpeech();
    setResetTrigger((current) => current + 1);
  }

  function closeFindGame() {
    setIsFreePlayMode(true);
    const nextItems = createOrderedItemSetForBook(activeBookId, 0);
    transitionToItems(nextItems);
    setPageHistory([nextItems]);
    setPageHistoryIndex(0);
    clearGameRound();
  }

  function browsePage(direction: "left" | "right") {
    if (isFindGameModalVisible || isGameMode) {
      return;
    }

    if (direction === "left") {
      if (pageHistoryIndex === 0) {
        return;
      }

      const previousIndex = pageHistoryIndex - 1;
      const previousItems = pageHistory[previousIndex];
      if (!previousItems) {
        return;
      }

      transitionToItems(previousItems);
      setPageHistoryIndex(previousIndex);
      return;
    }

    const nextIndex = pageHistoryIndex + 1;
    if (nextIndex >= totalPageCount) {
      return;
    }

    const existingItems = pageHistory[nextIndex];

    if (existingItems) {
      transitionToItems(existingItems);
      setPageHistoryIndex(nextIndex);
      return;
    }

    const nextItems = createOrderedItemSetForBook(activeBookId, nextIndex);
    transitionToItems(nextItems);
    setPageHistory((current) => [...current, nextItems]);
    setPageHistoryIndex(nextIndex);
    setResetTrigger((current) => current + 1);
  }

  function askNextQuestion(
    previousItemId?: ItemId,
    modalOptions?: {
      openModal?: boolean;
      helperText?: string;
      actionLabel?: string;
    },
    bookId: BookId = activeBookId,
  ) {
    const nextItems = createRandomItemSetForBook(bookId, visibleItems.map((item) => item.id));
    const nextItem = pickTargetItem(nextItems, previousItemId);
    const nextPrompt = getGamePrompt(nextItem);
    transitionToItems(nextItems);
    setPageHistory([nextItems]);
    setPageHistoryIndex(0);
    setResetTrigger((current) => current + 1);
    setTargetItemId(nextItem.id);
    setGamePrompt(nextPrompt);
    if (modalOptions?.openModal) {
      openFindGameModal({
        helperText: modalOptions.helperText,
        actionLabel: modalOptions.actionLabel,
      });
    }
  }

  function openFindGameModal(options?: {
    helperText?: string;
    actionLabel?: string;
  }) {
    setFindGameHelperText(
      options?.helperText ?? "Höre zu und tippe danach auf das richtige Bild.",
    );
    setFindGameActionLabel(options?.actionLabel ?? "Starten");
    setIsFindGameModalVisible(true);
  }

  function handleFindGameModalAction() {
    if (findGameActionLabel === "Nochmal hören" && gamePrompt) {
      clearInteractionQueue();
      void speakGerman(gamePrompt);
    }

    setIsFindGameModalVisible(false);
  }

  function getGamePrompt(item: ItemDefinition) {
    if (difficulty !== "advanced" || !item.advancedPrompts?.length) {
      return item.questionPrompt;
    }

    const promptIndex = Math.floor(Math.random() * item.advancedPrompts.length);
    return item.advancedPrompts[promptIndex];
  }

  function toggleSpeech() {
    setSpeechOnState((current) => !current);
  }

  function toggleSounds() {
    setSoundsOnState((current) => !current);
  }

  function updateMusicVolume(volume: number) {
    setMusicVolume(volume);
  }

  function cycleBook(direction: "left" | "right") {
    const delta: 1 | -1 = direction === "left" ? -1 : 1;
    const nextIndex = (previewBookIndex + delta + PICTURE_BOOKS.length) % PICTURE_BOOKS.length;
    const nextBook = PICTURE_BOOKS[nextIndex] ?? PICTURE_BOOKS[0];
    setBookTurnDirection(delta);
    bookCoverTurn.stopAnimation();
    bookCoverLift.stopAnimation();
    bookCoverSheen.stopAnimation();
    bookCoverTurn.setValue(0);
    bookCoverLift.setValue(0);
    bookCoverSheen.setValue(0);

    Animated.parallel([
      Animated.timing(bookCoverTurn, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(bookCoverLift, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(bookCoverSheen, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setPreviewBookIndex(nextIndex);
      clearInteractionQueue();
      void speakGerman(nextBook.label);

      Animated.parallel([
        Animated.timing(bookCoverTurn, {
          toValue: 0,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.spring(bookCoverLift, {
          toValue: 0,
          useNativeDriver: true,
          speed: 16,
          bounciness: 7,
        }),
        Animated.timing(bookCoverSheen, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  function activatePreviewBook() {
    const nextBook = previewBook;
    setActiveBookId(nextBook.id);
    const nextItems = createOrderedItemSetForBook(nextBook.id, 0);
    transitionToItems(nextItems);
    setPageHistory([nextItems]);
    setPageHistoryIndex(0);
    setResetTrigger((current) => current + 1);

    if (isGameMode) {
      setTimeout(() => {
        void askNextQuestion(undefined, {
          openModal: false,
          helperText: `Jetzt spielen wir mit ${nextBook.label.toLowerCase()}.`,
          actionLabel: "Weiter",
        }, nextBook.id);
      }, 180);
      return;
    }

    clearInteractionQueue();
    void speakGerman(`${nextBook.label}. ${nextBook.description}`);
  }

  function transitionToItems(nextItems: ItemDefinition[]) {
    setIsPageTurning(true);
    pageTurnProgress.stopAnimation();
    pageTurnProgress.setValue(0);

    Animated.sequence([
      Animated.timing(pageTurnProgress, {
        toValue: 0.5,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(pageTurnProgress, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 10,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsPageTurning(false);
        pageTurnProgress.setValue(0);
      }
    });

    setTimeout(() => {
      setVisibleItems(nextItems);
    }, 170);
  }

  function renderBookAccents(book: PictureBookDefinition) {
    return book.sceneAccents?.map((accent, index) => {
      const sharedPosition = {
        top: accent.top,
        right: accent.right,
        bottom: accent.bottom,
        left: accent.left,
        opacity: accent.opacity ?? 1,
      };

      if (accent.kind === "emoji") {
        return (
          <Text
            key={`${book.id}-accent-${index}`}
            style={[
              styles.bookAccentEmoji,
              sharedPosition,
              {
                fontSize: accent.size ?? 20,
                color: accent.color,
                letterSpacing: accent.letterSpacing,
              },
            ]}
          >
            {accent.value}
          </Text>
        );
      }

      return (
        <View
          key={`${book.id}-accent-${index}`}
          style={[
            styles.bookAccentShape,
            sharedPosition,
            {
              width: accent.width ?? 16,
              height: accent.height ?? 16,
              borderRadius: accent.borderRadius ?? 999,
              backgroundColor: accent.backgroundColor ?? "rgba(255,255,255,0.25)",
            },
          ]}
        />
      );
    });
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <Pressable
            delayLongPress={700}
            onLongPress={() => setShowParentSettings(true)}
            style={[styles.parentIconButton, isCompactPhone ? styles.parentIconButtonCompact : null]}
          >
            <Text style={styles.parentIconText}>🌼</Text>
          </Pressable>

          {visibleSceneItems.map((item) => (
            <SceneWordButton
              key={item.id}
              disabled={!isFreePlayMode || isGameMode || isFindGameModalVisible}
              onPress={() => handleSceneWordTap(item.label, item.phrase)}
              reaction={item.reaction}
              style={[
                styles[item.style],
                isCompactPhone ? getCompactSceneItemStyle(item.style) : null,
              ]}
            >
              {item.style === "cloudOne" || item.style === "cloudTwo" ? (
                <>
                  <View style={styles.cloudPuffLeft} />
                  <View style={styles.cloudPuffMiddle} />
                  <View style={styles.cloudPuffRight} />
                </>
              ) : null}
              {item.style === "sun" ? (
                <>
                  <View style={styles.sunAura} />
                  <View style={styles.sunInner} />
                </>
              ) : null}
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

          <View pointerEvents="none" style={styles.backgroundScene}>
            {renderBookAccents(activeBook)}
            <View style={styles.hillBack} />
            <View style={styles.hillFrontLeft} />
            <View style={styles.hillFrontRight} />
            <View style={styles.pathCurve} />

            <Animated.View
              style={[
                styles.birdOne,
                {
                  transform: [
                    {
                      translateX: birdDriftOne.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 10],
                      }),
                    },
                    {
                      translateY: birdDriftOne.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -4],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.birdText}>ˇˇ</Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.birdTwo,
                {
                  transform: [
                    {
                      translateX: birdDriftTwo.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                    {
                      translateY: birdDriftTwo.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.birdText}>ˇˇ</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.flowerPatchLeft,
                {
                  transform: [
                    {
                      translateY: flowerBobLeft.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -3],
                      }),
                    },
                    {
                      rotate: flowerBobLeft.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "2deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.flowerText}>🌼 🌷</Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.flowerPatchRight,
                {
                  transform: [
                    {
                      translateY: flowerBobRight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -4],
                      }),
                    },
                    {
                      rotate: flowerBobRight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "-2deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.flowerText}>🌸 🌼</Text>
            </Animated.View>

            <View style={styles.tinyBushLeft} />
            <View style={styles.tinyBushRight} />
          </View>

          {!showParentSettings ? (
            <>
              <View style={[styles.modeArea, isCompactPhone ? styles.modeAreaCompact : null]}>
                <View style={[styles.modeRow, isCompactPhone ? styles.modeRowCompact : null]}>
                  <View style={[styles.modeGroup, isCompactPhone ? styles.modeGroupCompact : null]}>
                    <Pressable
                      style={[styles.modeButton, isFreePlayMode ? styles.modeButtonActive : null]}
                      onPress={startFreePlay}
                    >
                      <Text style={styles.modeButtonText}>Spielen</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={[styles.searchButton, isGameMode ? styles.modeButtonActive : null]}
                    onPress={startFindGame}
                  >
                    <Text style={styles.modeButtonText}>Finde</Text>
                  </Pressable>
                </View>
              </View>

              <View
                style={[
                  styles.bookChooserRow,
                  isCompactPhone ? styles.bookChooserRowCompact : null,
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => cycleBook("left")}
                  style={styles.bookArrowButton}
                >
                  <Text style={styles.bookArrowText}>‹</Text>
                </Pressable>

                <Animated.View
                  style={{
                    transform: [
                      {
                        translateY: bookCoverLift.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -4],
                        }),
                      },
                      {
                        translateX: bookCoverTurn.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 12 * bookTurnDirection],
                        }),
                      },
                      {
                        rotate: bookCoverTurn.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0deg", `${-8 * bookTurnDirection}deg`],
                        }),
                      },
                      {
                        scale: bookCoverTurn.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.96],
                        }),
                      },
                    ],
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={activatePreviewBook}
                    style={[
                      styles.bookCoverCard,
                      {
                        width: layout.bookChooserWidth,
                        backgroundColor: previewBook.color,
                        borderColor: previewBook.accentColor,
                      },
                      activeBookId === previewBook.id ? styles.bookCoverCardActive : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.bookCoverSpine,
                        { backgroundColor: previewBook.accentColor },
                      ]}
                    />
                    {activeBookId === previewBook.id ? (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.bookCoverBookmark,
                          { backgroundColor: previewBook.accentColor },
                        ]}
                      />
                    ) : null}
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.bookCoverSheen,
                        {
                          opacity: bookCoverSheen,
                          transform: [
                            {
                              translateX: bookCoverSheen.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-70, 70],
                              }),
                            },
                            { rotate: "-14deg" },
                          ],
                        },
                      ]}
                    />
                    <Text style={styles.bookEmoji}>{previewBook.emoji}</Text>
                    <Text style={styles.bookLabel}>{previewBook.label}</Text>
                  </Pressable>
                </Animated.View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => cycleBook("right")}
                  style={styles.bookArrowButton}
                >
                  <Text style={styles.bookArrowText}>›</Text>
                </Pressable>
              </View>

              {isGameMode && !isFindGameModalVisible ? (
                <View pointerEvents="none" style={styles.promptChip}>
                  <Text style={styles.promptChipText}>{gamePrompt}</Text>
                </View>
              ) : null}

              {successMessage ? (
                <View
                  pointerEvents="none"
                  style={[styles.successBubble, { top: 126 }]}
                >
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {wrongMessage ? (
                <View pointerEvents="none" style={styles.wrongBubble}>
                  <Text style={styles.wrongText}>{wrongMessage}</Text>
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

              <Animated.View
                pointerEvents="box-none"
                style={[
                  styles.vehicleLayer,
                  {
                    opacity: pageTurnProgress.interpolate({
                      inputRange: [0, 0.18, 0.5, 0.82, 1],
                      outputRange: [1, 0.86, 0.18, 0.86, 1],
                    }),
                    transform: [
                      {
                        translateX: pageTurnProgress.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, -56, 0],
                        }),
                      },
                      {
                        scale: pageTurnProgress.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 0.92, 1],
                        }),
                      },
                      {
                        rotate: pageTurnProgress.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: ["0deg", "-4deg", "0deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {visibleItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    home={homes[item.id]}
                    cardWidth={layout.cardWidth}
                    cardHeight={layout.cardHeight}
                    slotIndex={index}
                    interactionEnabled={!isFindGameModalVisible}
                    tapAnimationToken={tapTokens[item.id] ?? 0}
                    celebrationToken={celebrationTokens[item.id] ?? 0}
                    wrongTapToken={wrongTapTokens[item.id] ?? 0}
                    onTap={handleTap}
                    onLongPress={handleItemLongPress}
                  />
                ))}
              </Animated.View>

              <View
                style={[
                  styles.pageBrowseBar,
                  {
                    top: layout.cardRowY + layout.cardHeight + 62,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Vorherige Seite"
                  style={[
                    styles.pageBrowseArrow,
                    pageHistoryIndex === 0 || isFindGameModalVisible || isGameMode
                      ? styles.pageBrowseArrowDisabled
                      : null,
                  ]}
                  onPress={() => browsePage("left")}
                  disabled={pageHistoryIndex === 0 || isFindGameModalVisible || isGameMode}
                >
                  <Text style={styles.pageBrowseArrowText}>‹</Text>
                </Pressable>
                <Text style={styles.pageBrowseLabel}>Blättern</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nächste Seite"
                  style={[
                    styles.pageBrowseArrow,
                    isFindGameModalVisible || isGameMode || isLastPageInBook
                      ? styles.pageBrowseArrowDisabled
                      : null,
                  ]}
                  onPress={() => browsePage("right")}
                  disabled={isFindGameModalVisible || isGameMode || isLastPageInBook}
                >
                  <Text style={styles.pageBrowseArrowText}>›</Text>
                </Pressable>
              </View>

              {isPageTurning ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.pageTurnSticker,
                    {
                      opacity: pageTurnProgress.interpolate({
                        inputRange: [0, 0.12, 0.86, 1],
                        outputRange: [0, 1, 1, 0],
                      }),
                      transform: [
                        {
                          translateX: pageTurnProgress.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [30, 0, -26],
                          }),
                        },
                        {
                          translateY: pageTurnProgress.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [18, -10, 6],
                          }),
                        },
                        {
                          scale: pageTurnProgress.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.85, 1.12, 0.94],
                          }),
                        },
                        {
                          rotate: pageTurnProgress.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: ["-10deg", "6deg", "-4deg"],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.pageTurnStickerText}>✨ Blättern ✨</Text>
                  <View style={styles.pageTurnCloudLeft} />
                  <View style={styles.pageTurnCloudRight} />
                </Animated.View>
              ) : null}

              <FindGameModal
                visible={isGameMode && isFindGameModalVisible}
                promptText={gamePrompt}
                helperText={findGameHelperText}
                actionLabel={findGameActionLabel}
                onClose={closeFindGame}
                onRetry={handleFindGameModalAction}
              />

              {previewedItem ? (
                <Pressable
                  style={styles.previewOverlay}
                  onPress={() => {
                    setPreviewedItem(null);
                    previewOpacity.setValue(0);
                  }}
                >
                  <Animated.View
                    style={[
                      styles.previewCard,
                      {
                        backgroundColor: previewedItem.color,
                        opacity: previewOpacity,
                        transform: [{ scale: previewScale }],
                      },
                    ]}
                  >
                    <View style={styles.previewTranslationBadge}>
                      <Text style={styles.previewTranslationText}>
                        {getEnglishMeaningForItem(previewedItem.id)}
                      </Text>
                    </View>
                    <View style={styles.previewVisualWrap}>
                      {previewedItem.imageSource ? (
                        <Image
                          source={previewedItem.imageSource}
                          style={styles.previewImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.previewEmoji}>{previewedItem.emoji}</Text>
                      )}
                    </View>
                    <View style={styles.previewBadge}>
                      <Text style={styles.previewLabel}>{previewedItem.speechName}</Text>
                    </View>
                  </Animated.View>
                </Pressable>
              ) : null}
            </>
          ) : null}

          {showParentSettings ? (
            <View style={styles.parentOverlay}>
              <View style={styles.parentCard}>
                <Text style={styles.parentTitle}>Elternbereich</Text>
                <Text style={styles.parentHint}>
                  Tippe lange auf die kleine Blume oben rechts, um die Einstellungen zu öffnen.
                </Text>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Sprache</Text>
                  <Pressable
                    style={[styles.toggleButton, speechOn ? styles.toggleOn : styles.toggleOff]}
                    onPress={toggleSpeech}
                  >
                    <Text style={styles.toggleText}>{speechOn ? "An" : "Aus"}</Text>
                  </Pressable>
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Sounds</Text>
                  <Pressable
                    style={[styles.toggleButton, soundsOn ? styles.toggleOn : styles.toggleOff]}
                    onPress={toggleSounds}
                  >
                    <Text style={styles.toggleText}>{soundsOn ? "An" : "Aus"}</Text>
                  </Pressable>
                </View>

                <Text style={styles.settingSectionTitle}>Musik</Text>
                <View style={styles.musicSliderRow}>
                  {MUSIC_VOLUME_STEPS.map((step, index) => (
                    <Pressable
                      key={step}
                      style={[
                        styles.musicStep,
                        musicVolume >= step && step > 0 ? styles.musicStepActive : null,
                        step === 0 && musicVolume === 0 ? styles.musicStepMuted : null,
                      ]}
                      onPress={() => updateMusicVolume(step)}
                    >
                      <Text style={styles.musicStepText}>
                        {index === 0 ? "Aus" : index}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.settingSectionTitle}>Schwierigkeit</Text>
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
                          ? "Leicht"
                          : level === "medium"
                            ? "Mittel"
                            : "Knifflig"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.difficultyHint}>{DIFFICULTY_DETAILS[difficulty]}</Text>

                <Pressable
                  style={styles.closeParentButton}
                  onPress={() => setShowParentSettings(false)}
                >
                  <Text style={styles.closeParentButtonText}>Schließen</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function bumpItemToken(
  setter: React.Dispatch<React.SetStateAction<ItemTokenMap>>,
  itemId: ItemId,
) {
  setter((current) => ({
    ...current,
    [itemId]: (current[itemId] ?? 0) + 1,
  }));
}

function createItemTokenMap() {
  return ITEMS.reduce<ItemTokenMap>((map, item) => {
    map[item.id] = 0;
    return map;
  }, {});
}

function createRandomItemSetForBook(bookId: BookId, excludedIds: ItemId[] = []) {
  const eligibleItems = getItemsForBook(bookId);
  const preferredPool = eligibleItems.filter((item) => !excludedIds.includes(item.id));
  const pool = preferredPool.length >= ITEMS_PER_PAGE ? preferredPool : eligibleItems;
  return pickUniqueItems(pool, ITEMS_PER_PAGE);
}

function createOrderedItemSetForBook(bookId: BookId, pageIndex: number) {
  const eligibleItems = getItemsForBook(bookId);
  const startIndex = pageIndex * ITEMS_PER_PAGE;
  const nextItems = eligibleItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return nextItems.length > 0 ? nextItems : eligibleItems.slice(0, ITEMS_PER_PAGE);
}

function pickTargetItem(items: ItemDefinition[], previousItemId?: ItemId) {
  const candidates = items.filter((item) => item.id !== previousItemId);
  const pool = candidates.length > 0 ? candidates : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickPraiseMessage() {
  return PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
}

function pickUniqueItems(items: ItemDefinition[], count: number) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
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
    backgroundColor: "#bde4f6",
  },
  container: {
    flex: 1,
    backgroundColor: "#bde4f6",
  },
  parentIconButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 40,
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "rgba(255,252,245,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.96)",
    ...createSurfaceShadow("#758ea3", 0.14, 10, 4, 4),
  },
  parentIconText: {
    fontSize: 20,
  },
  parentIconButtonCompact: {
    top: 12,
    right: 12,
    width: 40,
    height: 40,
  },
  backgroundScene: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  hillBack: {
    position: "absolute",
    left: -40,
    right: -30,
    bottom: 138,
    height: 140,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: "#cfe7bf",
  },
  hillFrontLeft: {
    position: "absolute",
    left: -24,
    bottom: 88,
    width: 230,
    height: 110,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 140,
    backgroundColor: "#b9d79d",
    transform: [{ rotate: "-4deg" }],
  },
  hillFrontRight: {
    position: "absolute",
    right: -18,
    bottom: 92,
    width: 250,
    height: 116,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    backgroundColor: "#b3d2a0",
    transform: [{ rotate: "4deg" }],
  },
  pathCurve: {
    position: "absolute",
    left: "34%",
    bottom: 86,
    width: 108,
    height: 92,
    borderTopLeftRadius: 70,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    backgroundColor: "rgba(245, 222, 188, 0.82)",
    transform: [{ rotate: "8deg" }],
  },
  birdOne: {
    position: "absolute",
    top: 126,
    left: 164,
  },
  birdTwo: {
    position: "absolute",
    top: 154,
    right: 132,
  },
  birdText: {
    fontSize: 26,
    color: "rgba(108, 117, 128, 0.72)",
    letterSpacing: -6,
  },
  flowerPatchLeft: {
    position: "absolute",
    left: 20,
    bottom: 76,
  },
  flowerPatchRight: {
    position: "absolute",
    right: 24,
    bottom: 70,
  },
  flowerText: {
    fontSize: 24,
    opacity: 0.92,
  },
  tinyBushLeft: {
    position: "absolute",
    left: 126,
    bottom: 134,
    width: 44,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#9fc48c",
  },
  tinyBushRight: {
    position: "absolute",
    right: 112,
    bottom: 142,
    width: 52,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#a6c792",
  },
  bookAccentShape: {
    position: "absolute",
  },
  bookAccentEmoji: {
    position: "absolute",
  },
  modeArea: {
    marginTop: 8,
    alignItems: "center",
    zIndex: 12,
  },
  modeAreaCompact: {
    marginTop: 4,
  },
  bookChooserRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
    zIndex: 12,
  },
  bookChooserRowCompact: {
    marginTop: 8,
    gap: 8,
    paddingHorizontal: 8,
  },
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  modeRowCompact: {
    gap: 6,
    paddingHorizontal: 10,
  },
  modeGroup: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  modeGroupCompact: {
    gap: 6,
  },
  bookArrowButton: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: "rgba(255,250,244,0.96)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    ...createSurfaceShadow("#8a97a8", 0.1, 10, 5, 3),
  },
  bookArrowText: {
    fontSize: 34,
    fontWeight: "700",
    color: "#6f6670",
    marginTop: -4,
  },
  bookCoverCard: {
    minHeight: 84,
    borderRadius: 28,
    borderWidth: 3,
    paddingLeft: 26,
    paddingRight: 18,
    paddingVertical: 12,
    justifyContent: "center",
    overflow: "hidden",
    ...createSurfaceShadow("#8393a4", 0.14, 12, 6, 4),
  },
  bookCoverCardActive: {
    transform: [{ scale: 1.02 }],
  },
  bookCoverBookmark: {
    position: "absolute",
    top: -2,
    right: 22,
    width: 22,
    height: 34,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  bookCoverSheen: {
    position: "absolute",
    top: -12,
    bottom: -12,
    width: 44,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  bookCoverSpine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
  },
  bookEmoji: {
    fontSize: 30,
  },
  bookLabel: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "900",
    color: "#495b6b",
  },
  modeButton: {
    minWidth: 108,
    minHeight: 48,
    backgroundColor: "rgba(255,250,244,0.92)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    ...createSurfaceShadow("#8a97a8", 0.12, 10, 5, 3),
  },
  modeButtonActive: {
    backgroundColor: "#f7d7b8",
  },
  modeButtonText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#5d5b6d",
  },
  pageBrowseControls: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  pageBrowseBar: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    zIndex: 70,
    elevation: 70,
  },
  pageBrowseArrow: {
    width: 52,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(244,233,214,0.96)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
    ...createSurfaceShadow("#928979", 0.1, 9, 4, 2),
  },
  pageBrowseArrowDisabled: {
    opacity: 0.45,
  },
  pageBrowseArrowText: {
    fontSize: 30,
    fontWeight: "900",
    color: "#7b6656",
    marginTop: -3,
  },
  pageBrowseLabel: {
    fontSize: 18,
    fontWeight: "900",
    color: "#6f6a62",
    backgroundColor: "rgba(255,250,244,0.88)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.94)",
    ...createSurfaceShadow("#8a97a8", 0.08, 8, 4, 2),
  },
  searchButton: {
    minWidth: 108,
    minHeight: 48,
    backgroundColor: "rgba(255,250,244,0.92)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    ...createSurfaceShadow("#8a97a8", 0.12, 10, 5, 3),
  },
  promptChip: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 250, 244, 0.92)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.94)",
    zIndex: 12,
    ...createSurfaceShadow("#8a97a8", 0.08, 8, 4, 2),
  },
  promptChipText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6a6370",
    textAlign: "center",
  },
  successBubble: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#fff7ee",
    zIndex: 95,
    elevation: 95,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.96)",
    ...createSurfaceShadow("#c9a47f", 0.12, 10, 5, 3),
  },
  successText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#b97258",
  },
  wrongBubble: {
    position: "absolute",
    top: 188,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 242, 214, 0.98)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.96)",
    zIndex: 94,
    elevation: 94,
    ...createSurfaceShadow("#c4a56f", 0.12, 10, 5, 3),
  },
  wrongText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#8d6a3f",
  },
  sparkleBurst: {
    position: "absolute",
    top: 196,
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
    zIndex: 30,
    elevation: 30,
  },
  sparkleText: {
    fontSize: 34,
  },
  cloudOne: {
    position: "absolute",
    top: 194,
    left: 104,
    width: 124,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  cloudTwo: {
    position: "absolute",
    top: 150,
    right: 28,
    width: 144,
    height: 62,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  cloudPuffLeft: {
    position: "absolute",
    left: 6,
    top: 18,
    width: 42,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(255,251,247,0.94)",
  },
  cloudPuffMiddle: {
    position: "absolute",
    top: 8,
    width: 56,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,251,247,0.98)",
  },
  cloudPuffRight: {
    position: "absolute",
    right: 6,
    top: 16,
    width: 44,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(255,251,247,0.94)",
  },
  sun: {
    position: "absolute",
    top: 154,
    left: 18,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#ffe39d",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 11,
    ...createSurfaceShadow("#ffd793", 0.26, 16, 6, 5),
  },
  sunAura: {
    position: "absolute",
    width: 94,
    height: 94,
    borderRadius: 999,
    backgroundColor: "rgba(255, 227, 157, 0.32)",
  },
  sunInner: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  station: {
    position: "absolute",
    left: 18,
    bottom: 124,
    width: 132,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#fff5df",
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
    backgroundColor: "#eef7ff",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    ...createSurfaceShadow("#5d7990", 0.12, 10, 5, 3),
  },
  cloudOneCompact: {
    top: 206,
    left: 78,
    width: 110,
  },
  cloudTwoCompact: {
    top: 164,
    right: 10,
    width: 118,
  },
  sunCompact: {
    top: 162,
    left: 14,
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
  vehicleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    elevation: 60,
  },
  pageTurnSticker: {
    position: "absolute",
    top: 196,
    alignSelf: "center",
    minWidth: 180,
    minHeight: 64,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255, 243, 226, 0.97)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.98)",
    zIndex: 88,
    elevation: 88,
    alignItems: "center",
    justifyContent: "center",
    ...createSurfaceShadow("#c1a688", 0.16, 16, 8, 5),
  },
  pageTurnStickerText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#9f765d",
  },
  pageTurnCloudLeft: {
    position: "absolute",
    left: 16,
    bottom: -10,
    width: 34,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  pageTurnCloudRight: {
    position: "absolute",
    right: 18,
    top: -8,
    width: 28,
    height: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 160,
    elevation: 160,
    backgroundColor: "rgba(54, 66, 80, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  previewCard: {
    width: "100%",
    maxWidth: 340,
    minHeight: 320,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    ...createSurfaceShadow("#6e7b87", 0.2, 18, 8, 6),
  },
  previewTranslationBadge: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  previewTranslationText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4c5660",
    textAlign: "center",
  },
  previewVisualWrap: {
    width: "100%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewEmoji: {
    fontSize: 144,
  },
  previewBadge: {
    backgroundColor: "rgba(255,250,245,0.94)",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  previewLabel: {
    fontSize: 30,
    fontWeight: "900",
    color: "#675c62",
    textAlign: "center",
  },
  parentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 22, 36, 0.48)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 200,
    elevation: 200,
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
  musicSliderRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  musicStep: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#e7ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  musicStepActive: {
    backgroundColor: "#f4cf9c",
  },
  musicStepMuted: {
    backgroundColor: "#d4dbe0",
  },
  musicStepText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4c5a66",
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

function getCompactSceneItemStyle(style: (typeof SCENE_ITEMS)[number]["style"]) {
  if (style === "cloudOne") {
    return styles.cloudOneCompact;
  }

  if (style === "cloudTwo") {
    return styles.cloudTwoCompact;
  }

  if (style === "sun") {
    return styles.sunCompact;
  }

  return null;
}
