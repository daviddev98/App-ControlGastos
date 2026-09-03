import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

import { useAppSettings } from '../hooks/useAppSettings';
import { ThemeColors } from '../constants/themes';

type CustomButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'transparent' | 'destructive';
};

export default function CustomButton({
  title,
  onPress,
  variant = 'primary',
}: CustomButtonProps) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
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
  });
