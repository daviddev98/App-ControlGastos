import React, { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { useAppSettings } from '../hooks/useAppSettings';
import { ThemeColors } from '../constants/themes';

type CustomButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'transparent' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
};

export default function CustomButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: CustomButtonProps) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.buttonText.color} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (
  colors: ThemeColors,
  variant: 'primary' | 'secondary' | 'transparent' | 'destructive'
) =>
  StyleSheet.create({
    button: {
      marginTop: 12,
      padding: 12,
      borderRadius: 4,
      alignItems: 'center',
      width: '100%',
      backgroundColor:
        variant === 'primary'
          ? colors.foreground
          : variant === 'secondary'
            ? colors.secondary
            : variant === 'destructive'
              ? colors.destructive
              : 'transparent',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '500',
      color:
        variant === 'transparent'
          ? colors.foreground
          : variant === 'secondary'
            ? colors.secondaryForeground
            : colors.primaryForeground,
    },
    disabled: {
      opacity: 0.55,
    },
  });
