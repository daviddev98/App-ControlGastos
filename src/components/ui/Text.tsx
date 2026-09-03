import React, { useMemo } from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { cn } from '../../lib/utils';

type TextVariant = 'default' | 'muted' | 'title' | 'subtitle' | 'label' | 'destructive' | 'link';

type Props = RNTextProps & {
  variant?: TextVariant;
};

export function Text({ variant = 'default', style, ...props }: Props) {
  const { colors } = useAppSettings();
  const variantStyles = useMemo(() => createVariantStyles(colors), [colors]);

  return <RNText style={cn(variantStyles[variant], style)} {...props} />;
}

const createVariantStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    default: {
      color: colors.foreground,
      fontSize: 14,
    },
    muted: {
      color: colors.mutedForeground,
      fontSize: 13,
    },
    title: {
      color: colors.foreground,
      fontSize: 28,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.foreground,
      fontSize: 18,
      fontWeight: '600',
    },
    label: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontWeight: '500',
    },
    destructive: {
      color: colors.destructive,
      fontSize: 12,
    },
    link: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
  });
