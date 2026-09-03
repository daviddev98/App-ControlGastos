import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { colors, radius } from '../../constants/theme';
import { cn } from '../../lib/utils';
import { Text } from './Text';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success';

type Props = ViewProps & {
  label: string;
  variant?: BadgeVariant;
};

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  destructive: {
    backgroundColor: '#FEE2E2',
  },
  success: {
    backgroundColor: '#DCFCE7',
  },
});

const textStyles = StyleSheet.create({
  default: { color: colors.primaryForeground },
  secondary: { color: colors.secondaryForeground },
  outline: { color: colors.foreground },
  destructive: { color: colors.destructive },
  success: { color: colors.success },
});

export function Badge({ label, variant = 'default', style, ...props }: Props) {
  return (
    <View style={cn(styles.badge, variantStyles[variant], style)} {...props}>
      <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
