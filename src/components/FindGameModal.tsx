import React from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type FindGameModalProps = {
  visible: boolean;
  promptText: string;
  helperText: string;
  actionLabel: string;
  onClose: () => void;
  onRetry: () => void;
};

export function FindGameModal({
  visible,
  promptText,
  helperText,
  actionLabel,
  onClose,
  onRetry,
}: FindGameModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Find Game</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Schließen</Text>
            </Pressable>
          </View>

          <Text style={styles.promptText}>{promptText}</Text>
          <Text style={styles.helperText}>{helperText}</Text>

          <Pressable style={styles.actionButton} onPress={onRetry}>
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(12, 29, 45, 0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 36,
  },
  card: {
    width: "100%",
    maxWidth: 392,
    borderRadius: 32,
    backgroundColor: "rgba(255,252,247,0.99)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
    ...createSurfaceShadow("#17324b", 0.16, 18, 10, 8),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
  },
  titleWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1d425c",
    flexShrink: 1,
  },
  closeButton: {
    minWidth: 120,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: "#dff2ff",
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#215170",
  },
  promptText: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 34,
    fontWeight: "900",
    color: "#ff7d62",
  },
  helperText: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
    color: "#547084",
  },
  actionButton: {
    alignSelf: "center",
    marginTop: 34,
    minWidth: 184,
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: "#ff966f",
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...createSurfaceShadow("#cf7a60", 0.14, 8, 4, 3),
  },
  actionButtonText: {
    fontSize: 21,
    fontWeight: "900",
    color: "#ffffff",
  },
});
