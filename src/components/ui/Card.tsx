import React, { useMemo } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { radius, shadows } from '../../constants/theme';
import { cn } from '../../lib/utils';
import { Text } from './Text';

export function Card({ style, ...props }: ViewProps) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={cn(styles.card, style)} {...props} />;
}

export function CardHeader({ style, ...props }: ViewProps) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={cn(styles.header, style)} {...props} />;
}

export function CardContent({ style, ...props }: ViewProps) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={cn(styles.content, style)} {...props} />;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <Text variant="subtitle">{children}</Text>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <Text variant="muted">{children}</Text>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 4,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
  });
