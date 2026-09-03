import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import CategoryIcon from './CategoryIcon';
import { useAppSettings } from '../hooks/useAppSettings';
import { MovementItem } from '../constants/sampleData';
import { ThemeColors } from '../constants/themes';
import { radius } from '../constants/theme';
import { formatLPS } from '../utils/currency';
import { getCategoryBaseName } from '../utils/categoryIcons';
import { Card, CardContent, Text } from './ui';

type Props = {
  item: MovementItem;
  onPress?: () => void;
};

export default function InstallmentCard({ item, onPress }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isExpense = item.amount < 0;

  const content = (
    <Card style={styles.card}>
      <CardContent>
        <View style={styles.topRow}>
          <CategoryIcon category={item.category} />

          <View style={styles.info}>
            <Text variant="default" style={styles.merchant}>
              {item.merchant}
            </Text>
            <Text variant="muted" style={styles.category}>
              {getCategoryBaseName(item.category)}
            </Text>
          </View>

          <View style={styles.amountBlock}>
            <Text
              variant="default"
              style={[styles.amount, isExpense && styles.expenseAmount]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatLPS(item.amount)}
            </Text>
            <Text variant="muted" style={styles.dueDate}>
              Vence el {item.dueDate}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <Text variant="muted" style={styles.bankAccount}>
            {item.bankAccount}
          </Text>
          <Text variant="link" style={styles.detailsLink}>
            {onPress ? 'Editar' : 'Ver detalles'}
          </Text>
        </View>
      </CardContent>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
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
    info: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    merchant: {
      fontWeight: '700',
      fontSize: 13,
    },
    category: {
      fontSize: 12,
    },
    amountBlock: {
      alignItems: 'flex-end',
      gap: 2,
      maxWidth: 110,
    },
    amount: {
      fontWeight: '700',
      fontSize: 12,
    },
    expenseAmount: {
      color: colors.destructive,
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
    bankAccount: {
      fontSize: 12,
      fontWeight: '600',
    },
    detailsLink: {
      fontSize: 12,
    },
  });
