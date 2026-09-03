import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppSettings } from '../hooks/useAppSettings';
import { ThemeColors } from '../constants/themes';
import { radius, spacing } from '../constants/theme';
import { Text } from './ui';

type ActionItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
};

type Props = {
  actions: ActionItem[];
};

export default function QuickActionButtons({ actions }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          style={styles.button}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name={action.icon} size={22} color={colors.foreground} />
          </View>
          <Text variant="muted" style={styles.label}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    button: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
