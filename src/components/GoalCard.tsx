import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppSettings } from '../hooks/useAppSettings';
import { GoalItem } from '../constants/sampleData';
import { ThemeColors } from '../constants/themes';
import { radius } from '../constants/theme';
import { formatLPS } from '../utils/currency';
import { Card, CardContent, Text } from './ui';

type Props = {
  item: GoalItem;
  onPayPress?: (item: GoalItem) => void;
};

export default function GoalCard({ item, onPayPress }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card}>
      <CardContent>
        <View style={styles.topRow}>
          <Image source={item.image} style={styles.image} resizeMode="cover" />

          <View style={styles.info}>
            <Text variant="default" style={styles.name}>
              {item.name}
            </Text>
            <Text variant="muted" style={styles.store}>
              {item.store}
            </Text>
          </View>

          <View style={styles.amountBlock}>
            <Text variant="default" style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
              {formatLPS(item.amount)}
            </Text>
            <Text variant="muted" style={styles.dueDate}>
              Vence el {item.dueDate}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View style={styles.installmentInfo}>
            <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
            <Text variant="muted" style={styles.installmentText}>
              {item.currentInstallment} de {item.totalInstallments} cuotas
            </Text>
          </View>

          <Pressable onPress={() => onPayPress?.(item)} hitSlop={8}>
            <Text variant="link" style={styles.payLink}>
              Pagar ahora
            </Text>
          </Pressable>
        </View>
      </CardContent>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      marginBottom: 12,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    image: {
      width: 48,
      height: 48,
      borderRadius: radius.sm,
      backgroundColor: colors.secondary,
    },
    info: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    name: {
      fontWeight: '700',
      fontSize: 14,
    },
    store: {
      fontSize: 12,
    },
    amountBlock: {
      alignItems: 'flex-end',
      gap: 2,
      maxWidth: 110,
    },
    amount: {
      fontWeight: '700',
      fontSize: 13,
    },
    dueDate: {
      fontSize: 11,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    installmentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    installmentText: {
      fontSize: 12,
      fontWeight: '500',
    },
    payLink: {
      fontSize: 12,
    },
  });