import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppSettings } from '../hooks/useAppSettings';
import { ThemeColors } from '../constants/themes';
import { radius } from '../constants/theme';
import { getMonthLabel, shiftMonth } from '../utils/date';
import { Text } from './ui';

type Props = {
  selectedDate: Date;
  onChange: (date: Date) => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
};

export default function MonthSelector({
  selectedDate,
  onChange,
  canGoPrev = true,
  canGoNext = true,
}: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.arrowButton, !canGoPrev && styles.disabled]}
        onPress={() => canGoPrev && onChange(shiftMonth(selectedDate, -1))}
        disabled={!canGoPrev}
      >
        <Ionicons name="chevron-back" size={18} color={colors.foreground} />
      </Pressable>

      <View style={styles.labelContainer}>
        <Text variant="default" style={styles.label}>
          {getMonthLabel(selectedDate)}
        </Text>
      </View>

      <Pressable
        style={[styles.arrowButton, !canGoNext && styles.disabled]}
        onPress={() => canGoNext && onChange(shiftMonth(selectedDate, 1))}
        disabled={!canGoNext}
      >
        <Ionicons name="chevron-forward" size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
      marginBottom: 12,
    },
    arrowButton: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondary,
    },
    labelContainer: {
      flex: 1,
      alignItems: 'center',
    },
    label: {
      fontWeight: '600',
      fontSize: 14,
    },
    disabled: {
      opacity: 0.35,
    },
  });
