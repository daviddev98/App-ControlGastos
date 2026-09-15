import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../../components/ScreenHeader';
import { Button, Text } from '../../components/ui';
import { radius, spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { CATEGORIAS_GRAFO, redCategorias } from '../../structures/redCategorias';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RedCategorias'>;
type TipoRecorrido = 'BFS' | 'DFS';

export default function RedCategoriasScreen({ navigation }: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [origen, setOrigen] = useState<string>(CATEGORIAS_GRAFO[0]);
  const [tipoRecorrido, setTipoRecorrido] = useState<TipoRecorrido>('BFS');
  const [recorrido, setRecorrido] = useState<string[]>([]);

  const vecinos = useMemo(() => redCategorias.vecinos(origen), [origen]);

  useEffect(() => {
    redCategorias.reconstruir();
  }, []);

  const handleRecorrer = (tipo: TipoRecorrido) => {
    setTipoRecorrido(tipo);
    const orden = tipo === 'BFS' ? redCategorias.bfs(origen) : redCategorias.dfs(origen);
    setRecorrido(orden);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Red de categorías" onBackPress={() => navigation.goBack()} />

        <Text variant="muted" style={styles.intro}>
          Grafo no dirigido con lista de adyacencia. Cada categoría es un vértice; las aristas
          unen gastos e ingresos relacionados. BFS recorre por niveles y DFS profundiza primero.
        </Text>

        <Text variant="label" style={styles.label}>
          Categoría de origen
        </Text>
        <View style={styles.chipRow}>
          {CATEGORIAS_GRAFO.map((categoria) => {
            const seleccionada = categoria === origen;
            return (
              <Pressable
                key={categoria}
                onPress={() => {
                  setOrigen(categoria);
                  setRecorrido([]);
                }}
                style={[styles.chip, seleccionada && styles.chipSelected]}
              >
                <Text
                  style={[styles.chipText, seleccionada && styles.chipTextSelected]}
                >
                  {categoria}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text variant="muted" style={styles.neighbors}>
          Vecinos: {vecinos.length > 0 ? vecinos.join(', ') : 'ninguno'}
        </Text>

        <View style={styles.actions}>
          <Button
            title="Recorrer BFS"
            variant={tipoRecorrido === 'BFS' && recorrido.length > 0 ? 'default' : 'outline'}
            size="sm"
            onPress={() => handleRecorrer('BFS')}
            style={styles.actionButton}
          />
          <Button
            title="Recorrer DFS"
            variant={tipoRecorrido === 'DFS' && recorrido.length > 0 ? 'default' : 'outline'}
            size="sm"
            onPress={() => handleRecorrer('DFS')}
            style={styles.actionButton}
          />
        </View>

        {recorrido.length > 0 ? (
          <View style={styles.resultCard}>
            <Text variant="label" style={styles.resultTitle}>
              Orden {tipoRecorrido} desde {origen}
            </Text>
            {recorrido.map((categoria, indice) => (
              <View key={`${tipoRecorrido}-${categoria}`} style={styles.resultRow}>
                <Text style={styles.resultIndex}>{indice + 1}</Text>
                <Text style={styles.resultName}>{categoria}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text variant="muted" style={styles.empty}>
            Elige un origen y ejecuta BFS o DFS para ver el orden de visita.
          </Text>
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
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    intro: {
      fontSize: 13,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    label: {
      marginBottom: spacing.sm,
      fontWeight: '600',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.full,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipSelected: {
      backgroundColor: '#38BDF8',
      borderColor: '#38BDF8',
    },
    chipText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.foreground,
    },
    chipTextSelected: {
      color: '#000000',
      fontWeight: '700',
    },
    neighbors: {
      fontSize: 12,
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: spacing.lg,
    },
    actionButton: {
      flex: 1,
    },
    resultCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: 8,
    },
    resultTitle: {
      fontWeight: '700',
      marginBottom: 4,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    resultIndex: {
      width: 22,
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    resultName: {
      fontSize: 14,
      color: colors.foreground,
    },
    empty: {
      textAlign: 'center',
      marginTop: spacing.md,
    },
  });
