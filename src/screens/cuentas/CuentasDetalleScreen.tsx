import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import CardWallet from '../../components/CardWallet';
import InstallmentCard from '../../components/InstallmentCard';
import ScreenHeader from '../../components/ScreenHeader';
import { Text } from '../../components/ui';
import { MovementItem, CardWalletData } from '../../constants/sampleData';
import { spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAccountById,
  selectMovimientosByAccount,
} from '../../store/selectors/financeSelectors';
import { fetchMovimientosByAccountThunk } from '../../store/slices/financeSlice';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CuentasDetalle'>;

export default function CuentasDetalleScreen({ navigation, route }: Props) {
  const { accountId } = route.params;
  const dispatch = useAppDispatch();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const account = useAppSelector(selectAccountById(accountId));
  const movimientos = useAppSelector(selectMovimientosByAccount(accountId));

  const wallet: CardWalletData = useMemo(() => {
    if (account?.type === 'credit_card' && account.brand) {
      return {
        brand: account.brand,
        usedBalance: account.balance,
        balanceLabel: 'Saldo utilizado',
      };
    }

    return {
      brand: 'mastercard',
      usedBalance: account?.balance ?? 0,
      balanceLabel:
        account?.type === 'bank' ? 'Saldo disponible' : 'Saldo utilizado',
    };
  }, [account]);

  const loadMovimientos = useCallback(() => {
    if (!account) {
      return;
    }

    dispatch(
      fetchMovimientosByAccountThunk({
        accountId: account.id,
        accountName: account.name,
      })
    );
  }, [account, dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadMovimientos();
    }, [loadMovimientos])
  );

  const handleMovementPress = (movement: MovementItem) => {
    navigation.navigate('RegistroMovimiento', { movimientoId: movement.id });
  };

  if (!account) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScreenHeader title="Cuenta" onBackPress={() => navigation.goBack()} />
        <Text variant="muted" style={styles.notFound}>
          No se encontró la cuenta solicitada.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={account.name}
          onBackPress={() => navigation.goBack()}
        />

        <CardWallet wallet={wallet} />

        <Text variant="subtitle" style={styles.sectionTitle}>
          Movimientos
        </Text>

        <View style={styles.movementsList}>
          {movimientos.length > 0 ? (
            movimientos.map((item) => (
              <InstallmentCard
                key={item.id}
                item={item}
                onPress={() => handleMovementPress(item)}
              />
            ))
          ) : (
            <Text variant="muted" style={styles.emptyText}>
              No hay movimientos registrados para esta cuenta.
            </Text>
          )}
        </View>
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
    sectionTitle: {
      marginBottom: spacing.md,
      fontSize: 20,
    },
    movementsList: {
      gap: 12,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: spacing.md,
    },
    notFound: {
      textAlign: 'center',
      marginTop: spacing.xl,
    },
  });
