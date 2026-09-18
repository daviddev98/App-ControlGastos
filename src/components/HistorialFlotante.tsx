import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '../constants/theme';
import { ThemeColors } from '../constants/themes';
import { useTheme } from '../context/ThemeContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectPuedeDeshacer,
  selectPuedeRehacer,
} from '../store/selectors/financeSelectors';
import { selectHistorialPanelToken } from '../store/selectors/uiSelectors';
import {
  deshacerMovimientoThunk,
  rehacerMovimientoThunk,
} from '../store/slices/financeSlice';
import { mostrarPanelHistorial, ocultarPanelHistorial } from '../store/slices/uiSlice';
import { Button, Text } from './ui';

const PANEL_DURATION_MS = 5000;

export default function HistorialFlotante() {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const token = useAppSelector(selectHistorialPanelToken);
  const puedeDeshacer = useAppSelector(selectPuedeDeshacer);
  const puedeRehacer = useAppSelector(selectPuedeRehacer);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    const hideTimer = setTimeout(() => {
      dispatch(ocultarPanelHistorial());
    }, PANEL_DURATION_MS);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [token, dispatch]);

  if (!token) {
    return null;
  }

  const handleDeshacer = async () => {
    setBusy(true);
    try {
      await dispatch(deshacerMovimientoThunk()).unwrap();
      dispatch(mostrarPanelHistorial());
    } catch (error) {
      Alert.alert(
        'No se pudo deshacer',
        typeof error === 'string' ? error : 'Intenta de nuevo.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRehacer = async () => {
    setBusy(true);
    try {
      await dispatch(rehacerMovimientoThunk()).unwrap();
      dispatch(mostrarPanelHistorial());
    } catch (error) {
      Alert.alert(
        'No se pudo rehacer',
        typeof error === 'string' ? error : 'Intenta de nuevo.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={[styles.panel, { bottom: Math.max(insets.bottom, 12) + 88 }]}>
        <Text variant="default" style={styles.title}>
          Movimiento eliminado
        </Text>
        <View style={styles.actions}>
          <Button
            title="Deshacer"
            variant="outline"
            size="sm"
            disabled={!puedeDeshacer || busy}
            onPress={handleDeshacer}
            style={styles.actionButton}
          />
          <Button
            title="Rehacer"
            variant="outline"
            size="sm"
            disabled={!puedeRehacer || busy}
            onPress={handleRehacer}
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9998,
      elevation: 9998,
    },
    panel: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 12,
    },
    title: {
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    actionButton: {
      flex: 1,
    },
  });
