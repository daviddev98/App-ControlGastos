import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useAppSettings } from '../hooks/useAppSettings';
import { ThemeColors } from '../constants/themes';
import { formatLPS } from '../utils/currency';
import { Card, CardContent, Text } from './ui';

type Props = {
  label: string;
  amount: number;
  highlight?: boolean;
};

export default function StatCard({ label, amount, highlight = false }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={[styles.card, highlight && styles.highlight]}>
      <CardContent style={styles.content}>
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
        <Text variant="default" style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
          {formatLPS(amount)}
        </Text>
      </CardContent>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 0,
    },
    highlight: {
      borderColor: colors.highlightBorder,
      backgroundColor: colors.highlight,
    },
    content: {
      paddingTop: 12,
      paddingBottom: 12,
      gap: 4,
    },
    label: {
      fontSize: 11,
    },
    amount: {
      fontSize: 11,
      fontWeight: '700',
    },
  });
