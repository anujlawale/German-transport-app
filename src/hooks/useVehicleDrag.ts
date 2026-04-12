import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
} from "react-native";
import { Point, VehicleDefinition, ZoneLayout } from "../../types";

type DragUpdate = {
  isDragging: boolean;
  isNearPreferredZone: boolean;
};

type UseVehicleDragOptions = {
  vehicle: VehicleDefinition;
  home: Point;
  preferredZone: ZoneLayout;
  resetTrigger: number;
  interactionEnabled: boolean;
  onTap: (vehicle: VehicleDefinition) => void;
  onMatch: (vehicle: VehicleDefinition) => void;
  onIncorrectDrop: (vehicle: VehicleDefinition) => void;
  onDragUpdate: (update: DragUpdate) => void;
};

const CARD_SIZE = 124;
const TAP_DISTANCE = 14;
const SNAP_PADDING = 40;

export function useVehicleDrag({
  vehicle,
  home,
  preferredZone,
  resetTrigger,
  interactionEnabled,
  onTap,
  onMatch,
  onIncorrectDrop,
  onDragUpdate,
}: UseVehicleDragOptions) {
  const pan = useRef(new Animated.ValueXY(home)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (interactionEnabled) {
      return;
    }

    Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
        speed: 16,
        bounciness: 5,
      }).start();
    setIsDragging(false);
    onDragUpdate({ isDragging: false, isNearPreferredZone: false });
  }, [interactionEnabled, onDragUpdate, scale]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: home,
        useNativeDriver: false,
        speed: 16,
        bounciness: 5,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
        speed: 16,
        bounciness: 5,
      }),
    ]).start();
    setIsDragging(false);
    onDragUpdate({ isDragging: false, isNearPreferredZone: false });
  }, [home, onDragUpdate, pan, resetTrigger, scale]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactionEnabled,
        onMoveShouldSetPanResponder: () => interactionEnabled,
        onPanResponderGrant: () => {
          if (!interactionEnabled) {
            return;
          }
          setIsDragging(true);
          pan.stopAnimation();
          Animated.spring(scale, {
            toValue: 1.08,
            useNativeDriver: false,
            speed: 18,
            bounciness: 6,
          }).start();
          onDragUpdate({ isDragging: true, isNearPreferredZone: false });
        },
        onPanResponderMove: (_event, gesture) => {
          const nextPosition = {
            x: home.x + gesture.dx,
            y: home.y + gesture.dy,
          };

          pan.setValue(nextPosition);

          const isNearPreferredZone = isNearZone(
            nextPosition.x + CARD_SIZE / 2,
            nextPosition.y + CARD_SIZE / 2,
            preferredZone,
          );

          onDragUpdate({ isDragging: true, isNearPreferredZone });
        },
        onPanResponderRelease: (event, gesture) => {
          handleRelease(event, gesture);
        },
        onPanResponderTerminate: () => {
          animateHome();
        },
      }),
    [
      home,
      interactionEnabled,
      onDragUpdate,
      onIncorrectDrop,
      onMatch,
      onTap,
      pan,
      preferredZone,
      scale,
      vehicle,
    ],
  );

  function handleRelease(
    _event: GestureResponderEvent,
    gesture: PanResponderGestureState,
  ) {
    const moved = Math.abs(gesture.dx) + Math.abs(gesture.dy) > TAP_DISTANCE;

    if (!moved) {
      setIsDragging(false);
      onDragUpdate({ isDragging: false, isNearPreferredZone: false });
      pan.setValue(home);
      scale.setValue(1);
      onTap(vehicle);
      return;
    }

    const currentX = home.x + gesture.dx;
    const currentY = home.y + gesture.dy;
    const centerX = currentX + CARD_SIZE / 2;
    const centerY = currentY + CARD_SIZE / 2;
    const isNearPreferredZone = isNearZone(centerX, centerY, preferredZone);

    if (isNearPreferredZone) {
      const snapPoint = getZoneSnapPoint(preferredZone);

      Animated.parallel([
        Animated.spring(pan, {
          toValue: snapPoint,
          useNativeDriver: false,
          speed: 18,
          bounciness: 9,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
          speed: 18,
          bounciness: 6,
        }),
      ]).start();

      setIsDragging(false);
      onDragUpdate({ isDragging: false, isNearPreferredZone: false });
      onMatch(vehicle);
      return;
    }

    onIncorrectDrop(vehicle);
    animateHome();
  }

  function animateHome() {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: home,
        useNativeDriver: false,
        speed: 14,
        bounciness: 4,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
        speed: 16,
        bounciness: 5,
      }),
    ]).start();

    setIsDragging(false);
    onDragUpdate({ isDragging: false, isNearPreferredZone: false });
  }

  return {
    cardSize: CARD_SIZE,
    isDragging,
    panHandlers: panResponder.panHandlers,
    dragTranslateX: pan.x,
    dragTranslateY: pan.y,
    dragScale: scale,
  };
}

function isNearZone(x: number, y: number, zone: ZoneLayout) {
  return (
    x >= zone.x - SNAP_PADDING &&
    x <= zone.x + zone.width + SNAP_PADDING &&
    y >= zone.y - SNAP_PADDING &&
    y <= zone.y + zone.height + SNAP_PADDING
  );
}

function getZoneSnapPoint(zone: ZoneLayout): Point {
  return {
    x: zone.x + zone.width / 2 - CARD_SIZE / 2,
    y: zone.y + zone.height / 2 - CARD_SIZE / 2,
  };
}
