import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  colaLabel?: string;
};

export default function InstallmentCard({ item, onPress, colaLabel }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isExpense = item.amount < 0;

  const content = (
    <Card style={styles.card}>
      <CardContent>
        <View style={styles.topRow}>
          <CategoryIcon category={item.category} />

          <View style={styles.info}>
            {colaLabel ? (
              <Text variant="muted" style={styles.colaLabel}>
                {colaLabel}
              </Text>
            ) : null}
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
          <View style={styles.bankRow}>
            <Text variant="muted" style={styles.bankAccount}>
              {item.bankAccount}
            </Text>
            {item.receiptUri ? (
              <View style={styles.receiptBadge}>
                <Image
                  source={{ uri: item.receiptUri }}
                  style={styles.receiptThumb}
                  resizeMode="cover"
                />
                <Ionicons name="document-attach-outline" size={12} color={colors.primary} />
              </View>
            ) : null}
          </View>
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
    colaLabel: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      color: colors.primary,
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
    bankRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    bankAccount: {
      fontSize: 12,
      fontWeight: '600',
    },
    receiptBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    receiptThumb: {
      width: 22,
      height: 22,
      borderRadius: 4,
      backgroundColor: colors.secondary,
    },
    detailsLink: {
      fontSize: 12,
    },
  });
