import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppSettings } from '../hooks/useAppSettings';
import { ThemeColors } from '../constants/themes';
import { radius } from '../constants/theme';
import { getCategoryIcon } from '../utils/categoryIcons';

type Props = {
  category: string;
  size?: number;
};

export default function CategoryIcon({ category, size = 48 }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);
  const Icon = getCategoryIcon(category);
  const iconSize = Math.round(size * 0.46);

  return (
    <View style={styles.container}>
      <Icon size={iconSize} color={colors.primary} strokeWidth={2} />
    </View>
  );
}

const createStyles = (colors: ThemeColors, size: number) =>
  StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: radius.sm,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
