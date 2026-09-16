import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import CardWallet from '../../components/CardWallet';
import CustomButton from '../../components/CustomButton';
import InstallmentCard from '../../components/InstallmentCard';
import ScreenHeader from '../../components/ScreenHeader';
import { Text } from '../../components/ui';
import { MovementItem, CardWalletData } from '../../constants/sampleData';
import { radius, spacing } from '../../constants/theme';
import { useToast } from '../../context/ToastContext';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAccountById,
  selectMovimientosByAccount,
} from '../../store/selectors/financeSelectors';
import {
  deleteAccountThunk,
  fetchMovimientosByAccountThunk,
} from '../../store/slices/financeSlice';
import { cuentasIndice } from '../../structures/cuentasIndice';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CuentasDetalle'>;

export default function CuentasDetalleScreen({ navigation, route }: Props) {
  const { accountId } = route.params;
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const account = useAppSelector((state) => selectAccountById(state, accountId));
  const movimientos = useAppSelector((state) => selectMovimientosByAccount(state, accountId));
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);

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

  const handleConfirmDelete = async () => {
    if (!account || deletingRef.current) {
      return;
    }

    deletingRef.current = true;
    setDeleting(true);

    try {
      await dispatch(
        deleteAccountThunk({
          accountId: account.id,
          accountName: account.name,
        })
      ).unwrap();

      setConfirmVisible(false);
      navigation.goBack();
      showToast('Cuenta eliminada');
    } catch {
      deletingRef.current = false;
      setDeleting(false);
      showToast('No se pudo eliminar la cuenta.', { variant: 'error' });
    }
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

  const movimientosCount = movimientos.length;
  const movimientosLabel =
    movimientosCount === 1
      ? '1 movimiento vinculado'
      : `${movimientosCount} movimientos vinculados`;

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

        <Text variant="muted" style={styles.hashHint}>
          Cuenta obtenida por clave hash (cubeta {cuentasIndice.cubetaDe(account.id)})
        </Text>

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

        <CustomButton
          title="Eliminar cuenta"
          variant="destructive"
          onPress={() => setConfirmVisible(true)}
        />
      </ScrollView>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) {
            setConfirmVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!deleting) {
                setConfirmVisible(false);
              }
            }}
          />
          <View style={styles.modalCard}>
            <Text variant="subtitle" style={styles.modalTitle}>
              ¿Eliminar {account.name}?
            </Text>
            <Text variant="muted" style={styles.modalMessage}>
              Se eliminarán todos los movimientos vinculados a esta cuenta (
              {movimientosLabel}). Esta acción no se puede deshacer.
            </Text>
            <CustomButton
              title={deleting ? 'Eliminando...' : 'Eliminar cuenta'}
              variant="destructive"
              onPress={handleConfirmDelete}
              disabled={deleting}
              loading={deleting}
            />
            <CustomButton
              title="Cancelar"
              variant="secondary"
              onPress={() => setConfirmVisible(false)}
              disabled={deleting}
            />
          </View>
        </View>
      </Modal>
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
    hashHint: {
      fontSize: 12,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    movementsList: {
      gap: 12,
      marginBottom: spacing.lg,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: spacing.md,
    },
    notFound: {
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    modalTitle: {
      fontSize: 18,
      marginBottom: spacing.sm,
    },
    modalMessage: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
  });
