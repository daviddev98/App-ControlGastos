import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SavingsMeta } from '../constants/sampleData';
import { radius } from '../constants/theme';
import { useAppSettings } from '../hooks/useAppSettings';
import { ThemeColors } from '../constants/themes';
import { formatLPS } from '../utils/currency';
import { getMetaProgress, getPriorityColor, getStatusColor } from '../utils/metas';
import { Card, CardContent, Text } from './ui';

type Props = {
  item: SavingsMeta;
  onPress: (item: SavingsMeta) => void;
};

export default function MetaListItem({ item, onPress }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = getMetaProgress(item);

  return (
    <Pressable onPress={() => onPress(item)}>
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              <Text variant="default" style={styles.name}>
                {item.nombre}
              </Text>
              <Text variant="muted" style={styles.description} numberOfLines={1}>
                {item.descripcion}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </View>

          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text variant="muted" style={styles.badgeText}>
                {item.categoria}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${getPriorityColor(item.prioridad)}22` }]}>
              <Text
                variant="muted"
                style={[styles.badgeText, { color: getPriorityColor(item.prioridad) }]}
              >
                {item.prioridad.charAt(0).toUpperCase() + item.prioridad.slice(1)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${getStatusColor(item.estado)}22` }]}>
              <Text
                variant="muted"
                style={[styles.badgeText, { color: getStatusColor(item.estado) }]}
              >
                {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.progressHeader}>
            <Text variant="muted" style={styles.progressLabel}>
              Progreso
            </Text>
            <Text variant="default" style={styles.progressPercent}>
              {progress}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: item.estado === 'completada' ? colors.success : colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.amountsRow}>
            <Text variant="muted" style={styles.amountText}>
              {formatLPS(item.montoActual)} de {formatLPS(item.montoObjetivo)}
            </Text>
            <Text variant="muted" style={styles.deadlineText}>
              Límite: {item.fechaLimite}
            </Text>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    titleBlock: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    name: {
      fontWeight: '700',
      fontSize: 15,
    },
    description: {
      fontSize: 12,
    },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    progressLabel: {
      fontSize: 12,
      fontWeight: '500',
    },
    progressPercent: {
      fontSize: 13,
      fontWeight: '700',
    },
    progressTrack: {
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.secondary,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    amountsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    amountText: {
      fontSize: 12,
      fontWeight: '600',
      flex: 1,
    },
    deadlineText: {
      fontSize: 11,
    },
  });
