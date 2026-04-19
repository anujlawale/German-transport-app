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
              <Text style={styles.title}>Finde!</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
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
    backgroundColor: "rgba(58, 74, 90, 0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 36,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: "rgba(255,250,244,0.99)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
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
    fontSize: 24,
    fontWeight: "900",
    color: "#6a6370",
    flexShrink: 1,
  },
  closeButton: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: "#f5e8d8",
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#7b6559",
    lineHeight: 24,
  },
  promptText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 30,
    fontWeight: "900",
    color: "#73687c",
  },
  helperText: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#7a7f86",
  },
  actionButton: {
    alignSelf: "center",
    marginTop: 22,
    minWidth: 150,
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: "#f2d1b3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    ...createSurfaceShadow("#cf7a60", 0.14, 8, 4, 3),
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#725848",
  },
});
