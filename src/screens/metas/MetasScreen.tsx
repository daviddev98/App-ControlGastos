import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import MetaListItem from '../../components/MetaListItem';
import ScreenHeader from '../../components/ScreenHeader';
import { Button, Text } from '../../components/ui';
import { SavingsMeta } from '../../constants/sampleData';
import { spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSavingsMetas } from '../../store/selectors/financeSelectors';
import { fetchSavingsMetasThunk } from '../../store/slices/financeSlice';
import { RootStackParamList } from '../../types/navigation';
import { getMetaProgress } from '../../utils/metas';

export default function MetasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const metas = useAppSelector(selectSavingsMetas);

  const loadMetas = useCallback(() => {
    dispatch(fetchSavingsMetasThunk());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadMetas();
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
    navigation.navigate('MetaForm', { metaId: meta.id });
  };

  const handleCreateMeta = () => {
    navigation.navigate('MetaForm');
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
              Progreso promedio
            </Text>
            <Text variant="subtitle" style={styles.summaryValue}>
              {averageProgress}%
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flag-outline" size={20} color={colors.foreground} />
            <Text variant="subtitle" style={styles.sectionTitle}>
              Mis objetivos
            </Text>
          </View>

          <Button variant="outline" size="icon" onPress={handleCreateMeta}>
            <Ionicons name="add" size={20} color={colors.foreground} />
          </Button>
        </View>

        <View style={styles.metasList}>
          {metas.map((meta) => (
            <MetaListItem key={meta.id} item={meta} onPress={handleMetaPress} />
          ))}
        </View>

        <Pressable style={styles.createButton} onPress={handleCreateMeta}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text variant="link" style={styles.createButtonText}>
            Crear nueva meta
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
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    summaryDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.sm,
    },
    summaryLabel: {
      fontSize: 12,
      textAlign: 'center',
    },
    summaryValue: {
      fontSize: 22,
      fontWeight: '700',
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
    metasList: {
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
