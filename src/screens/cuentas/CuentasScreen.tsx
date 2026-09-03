import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import AccountListItem from '../../components/AccountListItem';
import AccountsDonutChart from '../../components/AccountsDonutChart';
import ScreenHeader from '../../components/ScreenHeader';
import { Button, Text } from '../../components/ui';
import { Account } from '../../constants/sampleData';
import { spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAccounts,
  selectAccountsNetBalance,
} from '../../store/selectors/financeSelectors';
import { fetchAccountsThunk } from '../../store/slices/financeSlice';
import { formatLPS } from '../../utils/currency';
import { RootStackParamList } from '../../types/navigation';

export default function CuentasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const accounts = useAppSelector(selectAccounts);
  const totalBalance = useAppSelector(selectAccountsNetBalance);

  const loadAccounts = useCallback(() => {
    dispatch(fetchAccountsThunk());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts])
  );

  const handleOpenSettings = () => {
    navigation.navigate('Configuracion');
  };

  const handleAccountPress = (account: Account) => {
    navigation.navigate('CuentasDetalle', { accountId: account.id });
  };

  const handleCreateAccount = () => {
    navigation.navigate('NuevaCuenta');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title=""
          showBack={false}
          onSettingsPress={handleOpenSettings}
        />

        <AccountsDonutChart accounts={accounts} totalBalance={totalBalance} />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="menu-outline" size={20} color={colors.foreground} />
            <Text variant="subtitle" style={styles.sectionTitle}>
              Mis cuentas
            </Text>
          </View>

          <Button variant="outline" size="icon" onPress={handleCreateAccount}>
            <Ionicons name="add" size={20} color={colors.foreground} />
          </Button>
        </View>

        <View style={styles.totalRow}>
          <Ionicons name="wallet-outline" size={16} color={colors.mutedForeground} />
          <Text style={styles.totalLabel}>{formatLPS(totalBalance)}</Text>
        </View>

        <View style={styles.accountsList}>
          {accounts.map((account) => (
            <AccountListItem
              key={account.id}
              account={account}
              onPress={handleAccountPress}
            />
          ))}
        </View>

        <Pressable style={styles.createButton} onPress={handleCreateAccount}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text variant="link" style={styles.createButtonText}>
            Crear nueva cuenta
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 120,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 20,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
    },
    accountsList: {
      gap: 0,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    createButtonText: {
      fontWeight: '600',
    },
  });
