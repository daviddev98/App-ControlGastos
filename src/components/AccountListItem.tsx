import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppSettings } from '../hooks/useAppSettings';
import { Account } from '../constants/sampleData';
import { ThemeColors } from '../constants/themes';
import { radius, spacing } from '../constants/theme';
import { formatLPS } from '../utils/currency';
import CardBrandLogo from './CardBrandLogo';
import { Text } from './ui';

type Props = {
  account: Account;
  onPress: (account: Account) => void;
};

function AccountIcon({ account }: { account: Account }) {
  if (account.type === 'credit_card' && account.brand) {
    return (
      <View style={iconStyles.brandWrapper}>
        <CardBrandLogo brand={account.brand} width={36} height={22} />
      </View>
    );
  }

  const initials = account.name.slice(0, 2).toUpperCase();
  const isLightColor = account.color === '#E5E7EB' || account.color === '#FFFFFF';

  return (
    <View style={[iconStyles.circle, { backgroundColor: account.color }]}>
      <Text style={[iconStyles.initials, isLightColor && iconStyles.initialsDark]}>
        {initials}
      </Text>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  brandWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  initialsDark: {
    color: '#374151',
  },
});

export default function AccountListItem({ account, onPress }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => onPress(account)}
    >
      <AccountIcon account={account} />

      <View style={styles.info}>
        <Text variant="default" style={styles.name}>
          {account.name}
        </Text>
        <Text variant="muted" style={styles.subtitle}>
          {account.subtitle}
        </Text>
      </View>

      <Text variant="default" style={styles.balance}>
        {formatLPS(account.balance)}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    rowPressed: {
      opacity: 0.85,
    },
    info: {
      flex: 1,
      gap: 2,
    },
    name: {
      fontWeight: '700',
      fontSize: 16,
    },
    subtitle: {
      fontSize: 13,
    },
    balance: {
      color: colors.success,
      fontWeight: '700',
      fontSize: 15,
    },
  });
