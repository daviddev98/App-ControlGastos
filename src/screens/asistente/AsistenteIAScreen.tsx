import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSettings } from '../../hooks/useAppSettings';
import { analizarGasto, GeminiExpenseResult } from '../../services/gemini';
import { Text } from '../../components/ui/Text';
import { RootStackParamList } from '../../types/navigation';
import { formatLPS } from '../../utils/currency';

type Mensaje = {
  id: string;
  texto: string;
  tipo: 'usuario' | 'ia';
  resultado?: GeminiExpenseResult;
  error?: boolean;
};

const CATEGORIA_ICONOS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Supermercado: 'cart-outline',
  Transporte: 'car-outline',
  Electrónicos: 'hardware-chip-outline',
  Fotografía: 'camera-outline',
  Servicios: 'receipt-outline',
  Salud: 'medkit-outline',
  Entretenimiento: 'game-controller-outline',
  Salario: 'cash-outline',
  Freelance: 'laptop-outline',
  Inversiones: 'trending-up-outline',
  Regalo: 'gift-outline',
  Alimentación: 'fast-food-outline',
  Hogar: 'home-outline',
  Educación: 'school-outline',
  Otros: 'wallet-outline',
};

const EJEMPLOS_RAPIDOS = [
  'Gasté 150 en el super',
  'Pagué 45 de transporte',
  'Me depositaron 7500 de salario',
  'Pagué 500 de recibo de luz',
  'Compré medicina por 230',
];

export default function AsistenteIAScreen() {
  const { colors } = useAppSettings();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: '0',
      tipo: 'ia',
      texto:
        '¡Hola! Soy tu asistente financiero inteligente 🤖✨\n\nCuéntame cualquier gasto o ingreso en lenguaje natural y yo detectaré el monto, la categoría adecuada y te daré una sugerencia para optimizar tu dinero.\n\nPor ejemplo:\n• "Gasté 150 en el super"\n• "Pagué 45 de transporte"\n• "Me depositaron 7500 de salario"',
    },
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const procesarTexto = async (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || cargando) return;

    const idUsuario = Date.now().toString();
    setMensajes((prev) => [...prev, { id: idUsuario, tipo: 'usuario', texto: limpio }]);
    setInput('');
    setCargando(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const resultado = await analizarGasto(limpio);
      setMensajes((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          tipo: 'ia',
          texto: '',
          resultado,
        },
      ]);
    } catch (err: any) {
      const errorDetalle = err?.message || 'Ocurrió un inconveniente al consultar con Gemini. Verifica tu conexión.';
      setMensajes((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          tipo: 'ia',
          texto: errorDetalle,
          error: true,
        },
      ]);
    } finally {
      setCargando(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const animarYEnviar = (textoAEnviar?: string) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    procesarTexto(textoAEnviar ?? input);
  };

  const handleRegistrarMovimiento = (resultado: GeminiExpenseResult) => {
    navigation.navigate('RegistroMovimiento', {
      initialData: {
        amount: resultado.monto,
        merchant: resultado.descripcion,
        category: resultado.categoria,
        transactionType: resultado.tipo,
        notes: `Generado por Asistente IA: ${resultado.sugerencia}`,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Regresar"
          >
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>

          <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>

          <View style={styles.headerTitles}>
            <Text variant="subtitle" style={styles.headerMainTitle}>
              Asistente Financiero IA
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text variant="muted" style={styles.statusText}>
                En línea • Activo
              </Text>
            </View>
          </View>
        </View>

        {/* Mensajes */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {mensajes.map((m) => {
            const esIngreso = m.resultado?.tipo === 'ingreso';

            return (
              <View
                key={m.id}
                style={[styles.bubbleRow, m.tipo === 'usuario' ? styles.rowDerecha : styles.rowIzquierda]}
              >
                {m.tipo === 'ia' && (
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '25' }]}>
                    <Ionicons name="sparkles" size={14} color={colors.primary} />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    m.tipo === 'usuario'
                      ? [styles.bubbleUsuario, { backgroundColor: colors.primary }]
                      : [styles.bubbleIA, { backgroundColor: colors.card, borderColor: colors.border }],
                    m.error ? { borderColor: colors.destructive } : undefined,
                  ]}
                >
                  {/* Texto común */}
                  {(m.texto !== '' || m.error) && (
                    <Text
                      style={{
                        color:
                          m.tipo === 'usuario'
                            ? colors.primaryForeground
                            : m.error
                              ? colors.destructive
                              : colors.foreground,
                        fontSize: 14,
                        lineHeight: 21,
                      }}
                    >
                      {m.texto}
                    </Text>
                  )}

                  {/* Resultado financiero estructurado */}
                  {m.resultado && (
                    <View style={styles.resultadoContainer}>
                      {/* Encabezado: Tipo y Monto */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.montoContainer}>
                          <Ionicons
                            name={esIngreso ? 'arrow-up-circle' : 'arrow-down-circle'}
                            size={24}
                            color={esIngreso ? colors.success : colors.destructive}
                          />
                          <Text
                            style={[
                              styles.montoText,
                              { color: esIngreso ? colors.success : colors.destructive },
                            ]}
                          >
                            {esIngreso ? `+ ${formatLPS(m.resultado.monto)}` : formatLPS(m.resultado.monto)}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.tipoBadge,
                            {
                              backgroundColor: esIngreso ? colors.success + '20' : colors.destructive + '20',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              letterSpacing: 0.5,
                              color: esIngreso ? colors.success : colors.destructive,
                            }}
                          >
                            {esIngreso ? 'INGRESO' : 'GASTO'}
                          </Text>
                        </View>
                      </View>

                      {/* Fila con Categoría y Concepto */}
                      <View style={styles.infoMetaRow}>
                        <View
                          style={[
                            styles.categoryChip,
                            { backgroundColor: esIngreso ? colors.success + '18' : colors.primary + '18' },
                          ]}
                        >
                          <Ionicons
                            name={
                              CATEGORIA_ICONOS[m.resultado.categoria] ??
                              (esIngreso ? 'cash-outline' : 'wallet-outline')
                            }
                            size={14}
                            color={esIngreso ? colors.success : colors.primary}
                          />
                          <Text
                            style={[
                              styles.categoryChipText,
                              { color: esIngreso ? colors.success : colors.primary },
                            ]}
                          >
                            {m.resultado.categoria}
                          </Text>
                        </View>

                        <Text variant="default" style={styles.descripcionText} numberOfLines={1}>
                          {m.resultado.descripcion}
                        </Text>
                      </View>

                      {/* Caja de Sugerencia Inteligente */}
                      <View
                        style={[
                          styles.sugerenciaBox,
                          { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                      >
                        <View style={styles.sugerenciaIconWrap}>
                          <Ionicons name="bulb" size={16} color={colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sugerenciaTitle, { color: colors.warning }]}>
                            Sugerencia IA
                          </Text>
                          <Text style={[styles.sugerenciaBody, { color: colors.foreground }]}>
                            {m.resultado.sugerencia}
                          </Text>
                        </View>
                      </View>

                      {/* Botón para registrar el movimiento de inmediato */}
                      <Pressable
                        onPress={() => handleRegistrarMovimiento(m.resultado!)}
                        style={({ pressed }) => [
                          styles.btnRegistrar,
                          {
                            backgroundColor: esIngreso ? colors.success : colors.primary,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <Ionicons
                          name={esIngreso ? 'arrow-up-circle-outline' : 'add-circle-outline'}
                          size={18}
                          color={colors.primaryForeground}
                        />
                        <Text style={[styles.btnRegistrarText, { color: colors.primaryForeground }]}>
                          {esIngreso ? 'Registrar este ingreso' : 'Registrar este gasto'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Loader */}
          {cargando && (
            <View style={[styles.bubbleRow, styles.rowIzquierda]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '25' }]}>
                <Ionicons name="sparkles" size={14} color={colors.primary} />
              </View>
              <View style={[styles.bubble, styles.bubbleIA, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text variant="muted" style={{ fontSize: 13, marginLeft: 8 }}>
                    Analizando con Gemini...
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Ejemplos rápidos en scroll horizontal */}
        {!cargando && (
          <View style={styles.quickActionsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsList}>
              {EJEMPLOS_RAPIDOS.map((ejemplo, index) => (
                <Pressable
                  key={index}
                  onPress={() => animarYEnviar(ejemplo)}
                  style={({ pressed }) => [
                    styles.quickChip,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name="sparkles-outline" size={12} color={colors.primary} />
                  <Text style={[styles.quickChipText, { color: colors.foreground }]}>{ejemplo}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Barra de Input */}
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            placeholder="Ej: me pagaron 7500 de salario..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => animarYEnviar()}
            returnKeyType="send"
            multiline={false}
            maxLength={200}
          />

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              onPress={() => animarYEnviar()}
              disabled={cargando || !input.trim()}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: input.trim() && !cargando ? colors.primary : colors.muted,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje a la IA"
            >
              <Ionicons
                name="send"
                size={18}
                color={input.trim() && !cargando ? colors.primaryForeground : colors.mutedForeground}
              />
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 2,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 16,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowIzquierda: {
    justifyContent: 'flex-start',
  },
  rowDerecha: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 14,
  },
  bubbleUsuario: {
    borderBottomRightRadius: 4,
  },
  bubbleIA: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  resultadoContainer: {
    gap: 10,
    minWidth: 230,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  montoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  montoText: {
    fontSize: 22,
    fontWeight: '800',
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  infoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  descripcionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  sugerenciaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sugerenciaIconWrap: {
    marginTop: 2,
  },
  sugerenciaTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  sugerenciaBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  btnRegistrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 2,
  },
  btnRegistrarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  quickActionsWrap: {
    paddingVertical: 6,
  },
  quickActionsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
