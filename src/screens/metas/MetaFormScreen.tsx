import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { Text } from '../../components/ui';
import {
  META_CATEGORIES,
  META_PRIORITIES,
  META_STATUSES,
  MetaCategory,
  MetaPriority,
  MetaStatus,
  SavingsMeta,
} from '../../constants/sampleData';
import { radius, spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectSavingsMetaById } from '../../store/selectors/financeSelectors';
import { addSavingsMetaThunk, updateSavingsMetaThunk } from '../../store/slices/financeSlice';
import { RootStackParamList } from '../../types/navigation';
import { parseDDMMYYYYtoYYYYMMDD, parseYYYYMMDDToDDMMYYYY } from '../../utils/date';
import { getMetaProgress } from '../../utils/metas';
import { isRequired, isValidAmount, isValidDate } from '../../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'MetaForm'>;

type FormErrors = Partial<
  Record<
    | 'nombre'
    | 'descripcion'
    | 'categoria'
    | 'montoObjetivo'
    | 'montoActual'
    | 'fechaInicio'
    | 'fechaLimite'
    | 'prioridad'
    | 'estado'
    | 'notas',
    string
  >
>;

function toDisplayDate(value: string): string {
  if (!value) {
    return '';
  }
  if (value.includes('/')) {
    return value;
  }
  return parseYYYYMMDDToDDMMYYYY(value);
}

function parseFormDate(value: string): Date {
  const display = toDisplayDate(value);
  const iso = parseDDMMYYYYtoYYYYMMDD(display);
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return new Date();
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  minimumDate?: Date;
  colors: ThemeColors;
};

function DatePickerField({
  label,
  value,
  onChange,
  error,
  minimumDate,
  colors,
}: DatePickerFieldProps) {
  const styles = useMemo(() => createFieldStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseFormDate(value));

  const openPicker = () => {
    setDraft(parseFormDate(value));
    setOpen(true);
  };

  const applyDate = (date: Date) => {
    onChange(formatDate(date));
  };

  const handleValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      applyDate(selectedDate);
      return;
    }

    setDraft(selectedDate);
  };

  const handleDismiss = () => {
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <Pressable
        onPress={openPicker}
        style={[styles.input, styles.dateTrigger, error && styles.inputError]}
      >
        <Text style={[styles.dateValue, !value && styles.datePlaceholder]}>
          {toDisplayDate(value) || 'Selecciona una fecha'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.mutedForeground} />
      </Pressable>
      {error ? (
        <Text variant="destructive" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="calendar"
          minimumDate={minimumDate}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.dateOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
            <View style={styles.dateSheet}>
              <Text variant="subtitle" style={styles.dateSheetTitle}>
                {label}
              </Text>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                onValueChange={handleValueChange}
                style={styles.iosPicker}
              />
              <Pressable
                style={styles.dateConfirm}
                onPress={() => {
                  applyDate(draft);
                  setOpen(false);
                }}
              >
                <Text style={styles.dateConfirmText}>Listo</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
  colors: ThemeColors;
};

function FormField({
  label,
  value,
  onChange,
  placeholder,
  error,
  keyboardType = 'default',
  multiline = false,
  colors,
}: FormFieldProps) {
  const styles = useMemo(() => createFieldStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.inputMultiline, error && styles.inputError]}
      />
      {error ? (
        <Text variant="destructive" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

type ChipSelectorProps<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
  colors: ThemeColors;
};

function ChipSelector<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  colors,
}: ChipSelectorProps<T>) {
  const styles = useMemo(() => createFieldStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text
                variant="default"
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text variant="destructive" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default function MetaFormScreen({ navigation, route }: Props) {
  const { metaId } = route.params ?? {};
  const isEditing = Boolean(metaId);
  const dispatch = useAppDispatch();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const existingMeta = useAppSelector((state) => selectSavingsMetaById(state, metaId ?? ''));

  const [nombre, setNombre] = useState(existingMeta?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(existingMeta?.descripcion ?? '');
  const [categoria, setCategoria] = useState<MetaCategory>(existingMeta?.categoria ?? 'Ahorro');
  const [montoObjetivo, setMontoObjetivo] = useState(
    existingMeta ? String(existingMeta.montoObjetivo) : ''
  );
  const [montoActual, setMontoActual] = useState(
    existingMeta ? String(existingMeta.montoActual) : ''
  );
  const [fechaInicio, setFechaInicio] = useState(toDisplayDate(existingMeta?.fechaInicio ?? ''));
  const [fechaLimite, setFechaLimite] = useState(toDisplayDate(existingMeta?.fechaLimite ?? ''));
  const [prioridad, setPrioridad] = useState<MetaPriority>(existingMeta?.prioridad ?? 'media');
  const [estado, setEstado] = useState<MetaStatus>(existingMeta?.estado ?? 'activa');
  const [notes, setNotes] = useState(existingMeta?.notas ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  const categoryOptions = META_CATEGORIES.map((value) => ({ value, label: value }));

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!isRequired(nombre)) {
      nextErrors.nombre = 'El nombre es obligatorio.';
    }

    if (!isRequired(descripcion)) {
      nextErrors.descripcion = 'La descripción es obligatoria.';
    }

    if (!isRequired(montoObjetivo)) {
      nextErrors.montoObjetivo = 'El monto objetivo es obligatorio.';
    } else if (!isValidAmount(montoObjetivo)) {
      nextErrors.montoObjetivo = 'Ingresa un monto objetivo válido mayor a 0.';
    }

    if (!isRequired(montoActual)) {
      nextErrors.montoActual = 'El monto actual es obligatorio.';
    } else {
      const parsedActual = Number.parseFloat(montoActual.replace(',', '.'));
      const parsedObjetivo = Number.parseFloat(montoObjetivo.replace(',', '.'));
      if (Number.isNaN(parsedActual) || parsedActual < 0) {
        nextErrors.montoActual = 'Ingresa un monto actual válido.';
      } else if (!Number.isNaN(parsedObjetivo) && parsedActual > parsedObjetivo) {
        nextErrors.montoActual = 'El monto actual no puede superar el objetivo.';
      }
    }

    if (!isRequired(fechaInicio)) {
      nextErrors.fechaInicio = 'La fecha de inicio es obligatoria.';
    } else if (!isValidDate(fechaInicio)) {
      nextErrors.fechaInicio = 'Selecciona una fecha válida.';
    }

    if (!isRequired(fechaLimite)) {
      nextErrors.fechaLimite = 'La fecha límite es obligatoria.';
    } else if (!isValidDate(fechaLimite)) {
      nextErrors.fechaLimite = 'Selecciona una fecha válida.';
    } else if (
      isValidDate(fechaInicio) &&
      parseFormDate(fechaLimite).getTime() < parseFormDate(fechaInicio).getTime()
    ) {
      nextErrors.fechaLimite = 'La fecha límite no puede ser anterior al inicio.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildMeta = (): SavingsMeta => ({
    id: existingMeta?.id ?? '',
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    categoria,
    montoObjetivo: Number.parseFloat(montoObjetivo.replace(',', '.')),
    montoActual: Number.parseFloat(montoActual.replace(',', '.')),
    fechaInicio: parseDDMMYYYYtoYYYYMMDD(fechaInicio.trim()),
    fechaLimite: parseDDMMYYYYtoYYYYMMDD(fechaLimite.trim()),
    prioridad,
    estado,
    notas: notes.trim(),
  });

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const meta = buildMeta();

    try {
      if (isEditing) {
        await dispatch(updateSavingsMetaThunk(meta)).unwrap();
        Alert.alert('Meta actualizada', 'Los cambios se guardaron en la nube.');
      } else {
        await dispatch(addSavingsMetaThunk(meta)).unwrap();
        Alert.alert('Meta creada', 'Tu nueva meta se registró con éxito.');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al procesar la meta.');
    }
  };

  if (isEditing && !existingMeta) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Meta" onBackPress={() => navigation.goBack()} />
        <Text variant="muted" style={styles.notFound}>
          No se encontró la meta solicitada.
        </Text>
      </SafeAreaView>
    );
  }

  const previewProgress = getMetaProgress({
    id: '',
    nombre: '',
    descripcion: '',
    categoria: 'Ahorro',
    montoObjetivo: Number.parseFloat(montoObjetivo.replace(',', '.')) || 0,
    montoActual: Number.parseFloat(montoActual.replace(',', '.')) || 0,
    fechaInicio: '',
    fechaLimite: '',
    prioridad: 'media',
    estado: 'activa',
    notas: '',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            title={isEditing ? 'Detalle de meta' : 'Nueva meta'}
            onBackPress={() => navigation.goBack()}
          />

          {isEditing ? (
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text variant="muted" style={styles.previewLabel}>
                  Progreso actual
                </Text>
                <Text variant="default" style={styles.previewPercent}>
                  {previewProgress}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${previewProgress}%`,
                      backgroundColor: estado === 'completada' ? colors.success : colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.form}>
            <FormField
              label="Nombre"
              value={nombre}
              onChange={setNombre}
              placeholder="Ej. Fondo de emergencia"
              error={errors.nombre}
              colors={colors}
            />

            <FormField
              label="Descripción"
              value={descripcion}
              onChange={setDescripcion}
              placeholder="Describe el objetivo de esta meta"
              error={errors.descripcion}
              multiline
              colors={colors}
            />

            <ChipSelector
              label="Categoría"
              options={categoryOptions}
              value={categoria}
              onChange={setCategoria}
              error={errors.categoria}
              colors={colors}
            />

            <FormField
              label="Monto objetivo (L)"
              value={montoObjetivo}
              onChange={setMontoObjetivo}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.montoObjetivo}
              colors={colors}
            />

            <FormField
              label="Monto actual ahorrado (L)"
              value={montoActual}
              onChange={setMontoActual}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.montoActual}
              colors={colors}
            />

            <DatePickerField
              label="Fecha de inicio"
              value={fechaInicio}
              onChange={setFechaInicio}
              error={errors.fechaInicio}
              colors={colors}
            />

            <DatePickerField
              label="Fecha límite"
              value={fechaLimite}
              onChange={setFechaLimite}
              error={errors.fechaLimite}
              minimumDate={fechaInicio ? parseFormDate(fechaInicio) : undefined}
              colors={colors}
            />

            <ChipSelector
              label="Prioridad"
              options={META_PRIORITIES}
              value={prioridad}
              onChange={setPrioridad}
              error={errors.prioridad}
              colors={colors}
            />

            <ChipSelector
              label="Estado"
              options={META_STATUSES}
              value={estado}
              onChange={setEstado}
              error={errors.estado}
              colors={colors}
            />

            <FormField
              label="Notas"
              value={notes}
              onChange={setNotes}
              placeholder="Recordatorios, plan de ahorro, etc."
              multiline
              colors={colors}
            />
          </View>

          <CustomButton
            title={isEditing ? 'Guardar cambios' : 'Crear meta'}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createFieldStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.foreground,
    },
    inputMultiline: {
      minHeight: 80,
      paddingTop: 12,
    },
    inputError: {
      borderColor: colors.destructive,
    },
    error: {
      fontSize: 12,
    },
    dateTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    dateValue: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
    },
    datePlaceholder: {
      color: colors.muted,
    },
    dateOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      justifyContent: 'flex-end',
    },
    dateSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    dateSheetTitle: {
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    iosPicker: {
      height: 180,
    },
    dateConfirm: {
      marginTop: spacing.sm,
      backgroundColor: colors.foreground,
      borderRadius: radius.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    dateConfirmText: {
      color: colors.primaryForeground,
      fontWeight: '700',
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
    },
    chipTextSelected: {
      color: '#000000',
      fontWeight: '700',
    },
  });

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    form: {
      marginTop: spacing.md,
      gap: spacing.lg,
    },
    notFound: {
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    previewCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    previewLabel: {
      fontSize: 12,
      fontWeight: '500',
    },
    previewPercent: {
      fontSize: 16,
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
  });
