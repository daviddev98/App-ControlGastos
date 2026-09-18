import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import MetaListItem from '../../components/MetaListItem';
import ScreenHeader from '../../components/ScreenHeader';
import { Button, Card, CardContent, Text } from '../../components/ui';
import { SavingsMeta } from '../../constants/sampleData';
import { radius, spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectMetaBuscadaId,
  selectRankingInorden,
  selectSavingsMetas,
} from '../../store/selectors/financeSelectors';
import {
  deleteMultipleSavingsMetasThunk,
  fetchSavingsMetasThunk,
  setMetaBuscadaId,
} from '../../store/slices/financeSlice';
import { rankingMetas } from '../../structures/rankingMetas';
import { RootStackParamList } from '../../types/navigation';
import { formatLPS } from '../../utils/currency';
import { getMetaProgress } from '../../utils/metas';

export default function MetasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const metas = useAppSelector(selectSavingsMetas);
  const rankingInorden = useAppSelector(selectRankingInorden);
  const metaBuscadaId = useAppSelector(selectMetaBuscadaId);

  const [criterioBusqueda, setCriterioBusqueda] = useState('');
  const [mensajeBusqueda, setMensajeBusqueda] = useState<string | null>(null);
  const [esErrorBusqueda, setEsErrorBusqueda] = useState(false);

  // Estado del modo selección
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMetas = useCallback(() => {
    dispatch(fetchSavingsMetasThunk());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadMetas();
      // Salir del modo selección al volver a esta pantalla
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }, [loadMetas])
  );

  const activeCount = metas.filter((meta) => meta.estado === 'activa').length;
  const averageProgress =
    metas.length > 0
      ? Math.round(metas.reduce((sum, meta) => sum + getMetaProgress(meta), 0) / metas.length)
      : 0;

  const handleOpenSettings = () => {
    navigation.navigate('Configuracion');
  };

  const handleMetaPress = (meta: SavingsMeta) => {
    if (isSelectionMode) {
      toggleSelection(meta.id);
    } else {
      navigation.navigate('MetaForm', { metaId: meta.id });
    }
  };

  const handleCreateMeta = () => {
    navigation.navigate('MetaForm');
  };

  // ── Selección ──────────────────────────────────────────────────────────────

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
    setSelectedIds(new Set());
    dispatch(setMetaBuscadaId(null));
    setMensajeBusqueda(null);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(rankingInorden.map((m) => m.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const allSelected =
    rankingInorden.length > 0 && selectedIds.size === rankingInorden.length;

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      'Eliminar metas',
      selectedIds.size === 1
        ? '¿Estás seguro de que deseas eliminar esta meta? Esta acción no se puede deshacer.'
        : `¿Estás seguro de que deseas eliminar ${selectedIds.size} metas? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await dispatch(
                deleteMultipleSavingsMetasThunk(Array.from(selectedIds))
              ).unwrap();
              exitSelectionMode();
            } catch {
              Alert.alert('Error', 'No se pudieron eliminar las metas seleccionadas.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // ── Búsqueda ───────────────────────────────────────────────────────────────

  const handleBuscarMeta = () => {
    const termino = criterioBusqueda.trim();
    if (!termino) {
      dispatch(setMetaBuscadaId(null));
      setMensajeBusqueda(null);
      setEsErrorBusqueda(false);
      return;
    }

    const montoNumerico = Number(termino);
    let encontrada: SavingsMeta | undefined;

    if (!isNaN(montoNumerico) && montoNumerico > 0) {
      encontrada = rankingMetas.buscarPorMonto(montoNumerico);
    }

    if (!encontrada) {
      encontrada = rankingMetas.buscar(
        (m) =>
          m.id.toLowerCase() === termino.toLowerCase() ||
          m.nombre.toLowerCase().includes(termino.toLowerCase())
      );
    }

    if (encontrada) {
      dispatch(setMetaBuscadaId(encontrada.id));
      setMensajeBusqueda(
        `Meta encontrada: "${encontrada.nombre}" (${formatLPS(encontrada.montoObjetivo)})`
      );
      setEsErrorBusqueda(false);
    } else {
      dispatch(setMetaBuscadaId(null));
      setMensajeBusqueda(`No se encontró ninguna meta para "${termino}".`);
      setEsErrorBusqueda(true);
    }
  };

  const handleLimpiarBusqueda = () => {
    setCriterioBusqueda('');
    dispatch(setMetaBuscadaId(null));
    setMensajeBusqueda(null);
    setEsErrorBusqueda(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Metas"
          showBack={false}
          onSettingsPress={handleOpenSettings}
        />

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text variant="muted" style={styles.summaryLabel}>
              Metas activas
            </Text>
            <Text variant="subtitle" style={styles.summaryValue}>
              {activeCount}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="muted" style={styles.summaryLabel}>
              Progreso prom.
            </Text>
            <Text variant="subtitle" style={styles.summaryValue}>
              {averageProgress}%
            </Text>
          </View>
        </View>

        {/* Buscador — oculto en modo selección */}
        {!isSelectionMode && (
          <Card style={styles.searchCard}>
            <CardContent style={styles.searchContent}>
              <View style={styles.searchRow}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por monto o nombre..."
                    placeholderTextColor={colors.muted}
                    value={criterioBusqueda}
                    onChangeText={setCriterioBusqueda}
                    onSubmitEditing={handleBuscarMeta}
                    returnKeyType="search"
                  />
                  {criterioBusqueda.length > 0 && (
                    <Pressable onPress={handleLimpiarBusqueda} style={styles.clearSearchButton}>
                      <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                    </Pressable>
                  )}
                </View>
                <Button
                  size="sm"
                  onPress={handleBuscarMeta}
                  style={[styles.searchBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="search" size={16} color={colors.primaryForeground} />
                </Button>
              </View>

              {mensajeBusqueda && (
                <View
                  style={[
                    styles.searchFeedback,
                    esErrorBusqueda ? styles.searchFeedbackError : styles.searchFeedbackSuccess,
                  ]}
                >
                  <Ionicons
                    name={esErrorBusqueda ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                    size={16}
                    color={esErrorBusqueda ? colors.destructive : colors.success}
                  />
                  <Text
                    variant="muted"
                    style={[
                      styles.searchFeedbackText,
                      { color: esErrorBusqueda ? colors.destructive : colors.success },
                    ]}
                  >
                    {mensajeBusqueda}
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* Barra de modo selección */}
        {isSelectionMode && (
          <View style={styles.selectionBar}>
            <Pressable onPress={exitSelectionMode} style={styles.selectionBarAction}>
              <Ionicons name="close" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={styles.selectionBarTitle}>
              {selectedIds.size === 0
                ? 'Selecciona metas'
                : `${selectedIds.size} seleccionada${selectedIds.size > 1 ? 's' : ''}`}
            </Text>
            <Pressable
              onPress={allSelected ? deselectAll : selectAll}
              style={styles.selectionBarAction}
            >
              <Text style={[styles.selectionBarActionText, { color: colors.primary }]}>
                {allSelected ? 'Ninguna' : 'Todas'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.traversalSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flag-outline" size={20} color={colors.foreground} />
              <Text variant="subtitle" style={styles.sectionTitle}>
                Mis metas
              </Text>
            </View>

            <View style={styles.sectionActions}>
              {!isSelectionMode ? (
                <>
                  {rankingInorden.length > 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onPress={enterSelectionMode}
                      accessibilityLabel="Seleccionar metas para eliminar"
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.foreground} />
                    </Button>
                  )}
                  <Button variant="outline" size="icon" onPress={handleCreateMeta}>
                    <Ionicons name="add" size={20} color={colors.foreground} />
                  </Button>
                </>
              ) : (
                <Pressable
                  onPress={handleDeleteSelected}
                  style={[
                    styles.deleteButton,
                    selectedIds.size === 0 && styles.deleteButtonDisabled,
                  ]}
                  disabled={selectedIds.size === 0 || isDeleting}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={selectedIds.size > 0 ? '#FFFFFF' : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.deleteButtonText,
                      { color: selectedIds.size > 0 ? '#FFFFFF' : colors.mutedForeground },
                    ]}
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View style={styles.metasList}>
          {rankingInorden.length > 0 ? (
            rankingInorden.map((meta, index) => (
              <MetaListItem
                key={meta.id}
                item={meta}
                onPress={handleMetaPress}
                rankingIndex={index + 1}
                isHighlighted={!isSelectionMode && meta.id === metaBuscadaId}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(meta.id)}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={40} color={colors.mutedForeground} />
              <Text variant="muted" style={styles.emptyText}>
                No hay metas registradas.
              </Text>
            </View>
          )}
        </View>

        {!isSelectionMode && (
          <Pressable style={styles.createButton} onPress={handleCreateMeta}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text variant="link" style={styles.createButtonText}>
              Crear nueva meta
            </Text>
          </Pressable>
        )}
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
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    summaryDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    summaryLabel: {
      fontSize: 11,
      textAlign: 'center',
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '700',
    },
    searchCard: {
      borderRadius: 16,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchContent: {
      padding: spacing.sm,
      gap: 8,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondary,
      borderRadius: radius.md,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.foreground,
      paddingVertical: 2,
    },
    clearSearchButton: {
      padding: 2,
    },
    searchBtn: {
      paddingHorizontal: 12,
      height: 38,
      borderRadius: radius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchFeedback: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: radius.sm,
    },
    searchFeedbackSuccess: {
      backgroundColor: `${colors.success}1A`,
    },
    searchFeedbackError: {
      backgroundColor: `${colors.destructive}1A`,
    },
    searchFeedbackText: {
      fontSize: 12,
      fontWeight: '500',
      flex: 1,
    },
    traversalSection: {
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    tabsWrapper: {
      marginTop: 2,
    },
    explanationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.primary}0F`,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: `${colors.primary}26`,
    },
    explanationTextBlock: {
      flex: 1,
      gap: 2,
    },
    explanationTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    explanationDescription: {
      fontSize: 11,
      lineHeight: 15,
    },
    metasList: {
      gap: 0,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: 13,
      textAlign: 'center',
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
    sectionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    selectionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: colors.secondary,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
    },
    selectionBarAction: {
      padding: 4,
    },
    selectionBarTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      flex: 1,
      textAlign: 'center',
    },
    selectionBarActionText: {
      fontSize: 14,
      fontWeight: '600',
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.destructive,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
    deleteButtonDisabled: {
      backgroundColor: colors.secondary,
    },
    deleteButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

