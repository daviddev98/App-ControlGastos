import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  atenderSiguientePago,
  deshacerMovimientoThunk,
  fetchMovimientosByMonthThunk,
  reconstruirColaPagos,
  rehacerMovimientoThunk,
} from '../../store/slices/financeSlice';
import InstallmentCard from '../../components/InstallmentCard';
import MonthSelector from '../../components/MonthSelector';
import ScreenHeader from '../../components/ScreenHeader';
import SpendingChart from '../../components/SpendingChart';
import StatCard from '../../components/StatCard';
import { MovementItem } from '../../constants/sampleData';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '../../components/ui';
import { radius, spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectEtiquetaDeshacer,
  selectEtiquetaRehacer,
  selectMovimientosByMonth,
  selectPagosEnCola,
  selectPuedeDeshacer,
  selectPuedeRehacer,
  selectSiguientePagoId,
} from '../../store/selectors/financeSelectors';
import {
  selectInicioActiveTab,
  selectInicioSelectedMonthKey,
} from '../../store/selectors/uiSelectors';
import {
  setInicioActiveTab,
  setInicioSelectedMonthKey,
} from '../../store/slices/uiSlice';
import { RootStackParamList } from '../../types/navigation';
import { formatLPS } from '../../utils/currency';
import { getMonthKey } from '../../utils/date';
import { buildMonthStatistics } from '../../utils/statistics';

function monthKeyToDate(monthKey: string): Date {
  const [year, month] = monthKey.split('-');
  return new Date(Number(year), Number(month) - 1, 1);
}

export default function InicioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const activeTab = useAppSelector(selectInicioActiveTab);
  const selectedMonthKey = useAppSelector(selectInicioSelectedMonthKey);
  const movimientos = useAppSelector((state) => selectMovimientosByMonth(state, selectedMonthKey));
  const monthData = useMemo(
    () => buildMonthStatistics(movimientos, selectedMonthKey),
    [movimientos, selectedMonthKey]
  );
  const pagosEnCola = useAppSelector(selectPagosEnCola);
  const siguientePagoId = useAppSelector(selectSiguientePagoId);
  const puedeDeshacer = useAppSelector(selectPuedeDeshacer);
  const puedeRehacer = useAppSelector(selectPuedeRehacer);
  const etiquetaDeshacer = useAppSelector(selectEtiquetaDeshacer);
  const etiquetaRehacer = useAppSelector(selectEtiquetaRehacer);
  const [historialBusy, setHistorialBusy] = useState(false);

  const selectedMonth = useMemo(() => monthKeyToDate(selectedMonthKey), [selectedMonthKey]);

  const handleOpenSettings = () => {
    navigation.navigate('Configuracion');
  };

  const loadMovimientos = useCallback(() => {
    dispatch(fetchMovimientosByMonthThunk(selectedMonthKey));
  }, [dispatch, selectedMonthKey]);

  useFocusEffect(
    useCallback(() => {
      loadMovimientos();
    }, [loadMovimientos])
  );

  useEffect(() => {
    dispatch(reconstruirColaPagos(selectedMonthKey));
  }, [dispatch, selectedMonthKey, movimientos]);

  const handleMovementPress = (movement: MovementItem) => {
    navigation.navigate('RegistroMovimiento', { movimientoId: movement.id });
  };

  const handleAtenderSiguiente = () => {
    const siguiente = pagosEnCola[0];
    if (!siguiente) {
      return;
    }

    dispatch(atenderSiguientePago());
    Alert.alert(
      'Pago atendido',
      `${siguiente.merchant} salió de la cola. El siguiente será el más antiguo que quede pendiente.`
    );
  };

  const handleDeshacer = async () => {
    setHistorialBusy(true);
    try {
      await dispatch(deshacerMovimientoThunk()).unwrap();
    } catch (error) {
      Alert.alert(
        'No se pudo deshacer',
        typeof error === 'string' ? error : 'Intenta de nuevo.'
      );
    } finally {
      setHistorialBusy(false);
    }
  };

  const handleRehacer = async () => {
    setHistorialBusy(true);
    try {
      await dispatch(rehacerMovimientoThunk()).unwrap();
    } catch (error) {
      Alert.alert(
        'No se pudo rehacer',
        typeof error === 'string' ? error : 'Intenta de nuevo.'
      );
    } finally {
      setHistorialBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Estadística"
          showBack={false}
          onSettingsPress={handleOpenSettings}
        />

        <View style={styles.historyBar}>
          <Button
            title="Deshacer"
            variant="outline"
            size="sm"
            disabled={!puedeDeshacer || historialBusy}
            onPress={handleDeshacer}
            style={styles.historyButton}
          />
          <Button
            title="Rehacer"
            variant="outline"
            size="sm"
            disabled={!puedeRehacer || historialBusy}
            onPress={handleRehacer}
            style={styles.historyButton}
          />
        </View>
        <Text variant="muted" style={styles.historyHint}>
          {puedeDeshacer
            ? `Siguiente: deshacer ${etiquetaDeshacer}`
            : 'Registra, edita o elimina un movimiento para usar la pila LIFO.'}
          {puedeRehacer ? `  ·  Rehacer ${etiquetaRehacer}` : ''}
        </Text>

        <MonthSelector
          selectedDate={selectedMonth}
          onChange={(date) => dispatch(setInicioSelectedMonthKey(getMonthKey(date)))}
        />

        <Text variant="label">Gasto total</Text>
        <Text variant="title" style={styles.totalSpending}>
          {formatLPS(monthData.totalSpending)}
        </Text>

        <SpendingChart
          data={monthData.chartData}
          highlightAmount={monthData.chartHighlight.amount}
          highlightDate={monthData.chartHighlight.date}
          startLabel={monthData.startLabel}
          endLabel={monthData.endLabel}
        />

        <View style={styles.statsRow}>
          <StatCard label="Ingresos" amount={monthData.ingresos} />
          <StatCard label="Gastos" amount={-monthData.gastos} highlight />
          <StatCard label="Total" amount={monthData.total} />
        </View>

        <View style={styles.installmentsPanel}>
          <Tabs
            value={activeTab}
            onValueChange={(value) => dispatch(setInicioActiveTab(value))}
          >
            <TabsList>
              <TabsTrigger value="movimientos" title="Movimientos" />
              <TabsTrigger value="pagos-programados" title="Pagos programados" />
            </TabsList>

            <TabsContent value="movimientos">
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
                  No hay movimientos registrados en este mes.
                </Text>
              )}
            </TabsContent>

            <TabsContent value="pagos-programados">
              {pagosEnCola.length > 0 ? (
                <>
                  <Text variant="muted" style={styles.queueHint}>
                    Cola FIFO: el gasto que vence primero está al frente. Atenderlo lo saca;
                    el siguiente pasa a ser el más antiguo que quede.
                  </Text>
                  <Button
                    title="Atender siguiente"
                    variant="outline"
                    size="sm"
                    onPress={handleAtenderSiguiente}
                    style={styles.queueButton}
                  />
                  {pagosEnCola.map((item, index) => (
                    <InstallmentCard
                      key={item.id}
                      item={item}
                      colaLabel={
                        item.id === siguientePagoId
                          ? 'Frente de la cola'
                          : `Turno ${index + 1}`
                      }
                      onPress={() => handleMovementPress(item)}
                    />
                  ))}
                </>
              ) : (
                <Text variant="muted" style={styles.emptyText}>
                  No hay pagos pendientes en la cola de este mes.
                </Text>
              )}
            </TabsContent>
          </Tabs>
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
    totalSpending: {
      marginTop: 4,
      marginBottom: 8,
      fontSize: 34,
    },
    historyBar: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 6,
    },
    historyButton: {
      flex: 1,
    },
    historyHint: {
      fontSize: 12,
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
      marginBottom: 24,
    },
    installmentsPanel: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
      minHeight: 320,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: spacing.md,
    },
    queueHint: {
      fontSize: 12,
      marginBottom: 10,
    },
    queueButton: {
      marginBottom: 12,
      width: '100%',
    },
  });
