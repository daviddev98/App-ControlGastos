import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMovimientosByMonthThunk } from '../../store/slices/financeSlice';
import InstallmentCard from '../../components/InstallmentCard';
import MonthSelector from '../../components/MonthSelector';
import ScreenHeader from '../../components/ScreenHeader';
import SpendingChart from '../../components/SpendingChart';
import StatCard from '../../components/StatCard';
import { MovementItem } from '../../constants/sampleData';
import { Tabs, TabsContent, TabsList, TabsTrigger, Text } from '../../components/ui';
import { radius, spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectMonthStatistics,
  selectMovimientosByMonth,
  selectPagosProgramadosByMonth,
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
  const monthData = useAppSelector(selectMonthStatistics(selectedMonthKey));
  const movimientos = useAppSelector(selectMovimientosByMonth(selectedMonthKey));
  const pagosProgramados = useAppSelector(selectPagosProgramadosByMonth(selectedMonthKey));

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

  const handleMovementPress = (movement: MovementItem) => {
    navigation.navigate('RegistroMovimiento', { movimientoId: movement.id });
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
              {pagosProgramados.length > 0 ? (
                pagosProgramados.map((item) => (
                  <InstallmentCard
                    key={item.id}
                    item={item}
                    onPress={() => handleMovementPress(item)}
                  />
                ))
              ) : (
                <Text variant="muted" style={styles.emptyText}>
                  No hay pagos programados en este mes.
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
  });
