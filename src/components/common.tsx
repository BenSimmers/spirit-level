import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../theme";

type ErrorBannerProps = {
  message: string;
  style?: StyleProp<ViewStyle>;
};

type RefreshButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, style }) => (
  <View style={[styles.errorBox, style]}>
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onPress, disabled = false }) => (
  <Pressable
    style={[styles.refreshBtn, disabled && styles.refreshBtnDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <Ionicons name="refresh" size={16} color={colors.primary} />
  </Pressable>
);

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: "center",
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtnDisabled: {
    opacity: 0.35,
  },
});
