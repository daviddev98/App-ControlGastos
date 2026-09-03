import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addMovimientoThunk, deleteMovimientoThunk, updateMovimientoThunk } from '../../store/slices/financeSlice';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { Tabs, TabsList, TabsTrigger, Text } from '../../components/ui';
import {
  BANK_ACCOUNTS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TransactionType,
} from '../../constants/sampleData';
import { radius, spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAccounts, selectMovimientoById } from '../../store/selectors/financeSelectors';
import { RootStackParamList } from '../../types/navigation';
import { parseDDMMYYYYtoYYYYMMDD, parseYYYYMMDDToDDMMYYYY } from '../../utils/date';
import {
  buildCategoryWithNotes,
  splitCategoryAndNotes,
} from '../../utils/movimientos';
import {
  isRequired,
  isValidAmount,
  isValidDate,
  isValidDueDay,
} from '../../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistroMovimiento'>;

type FormErrors = Partial<
  Record<'amount' | 'merchant' | 'category' | 'bankAccount' | 'date' | 'dueDate', string>
>;

function formatToday(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'numeric';
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

type ChipSelectorProps = {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  colors: ThemeColors;
};

function ChipSelector({ label, options, value, onChange, error, colors }: ChipSelectorProps) {
  const styles = useMemo(() => createFieldStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text
                variant="default"
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
              >
                {option}
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

export default function RegistrarMovimientoScreen({ navigation, route }: Props) {
  const movimientoId = route.params?.movimientoId;
  const isEditing = Boolean(movimientoId);
  const dispatch = useAppDispatch();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const existingMovement = useAppSelector(selectMovimientoById(movimientoId ?? ''));
  const accounts = useAppSelector(selectAccounts);

  const [transactionType, setTransactionType] = useState<TransactionType>('gasto');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [date, setDate] = useState(formatToday());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!existingMovement) {
      return;
    }

    const { category: baseCategory, notes: movementNotes } = splitCategoryAndNotes(
      existingMovement.category
    );

    setTransactionType(existingMovement.amount < 0 ? 'gasto' : 'ingreso');
    setAmount(String(Math.abs(existingMovement.amount)));
    setMerchant(existingMovement.merchant);
    setCategory(baseCategory);
    setBankAccount(existingMovement.bankAccount);
    setDate(
      existingMovement.date
        ? parseYYYYMMDDToDDMMYYYY(existingMovement.date)
        : formatToday()
    );
    setDueDate(String(existingMovement.dueDate));
    setNotes(movementNotes);
    setErrors({});
  }, [existingMovement]);

  const bankAccountOptions = useMemo(() => {
    const accountNames = accounts.map((account) => account.name);
    return [...new Set([...accountNames, ...BANK_ACCOUNTS, bankAccount].filter(Boolean))];
  }, [accounts, bankAccount]);

  const categories =
    transactionType === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (type: string) => {
    setTransactionType(type as TransactionType);
    setCategory('');
    setErrors({});
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!isRequired(amount)) {
      nextErrors.amount = 'El monto es obligatorio.';
    } else if (!isValidAmount(amount)) {
      nextErrors.amount = 'Ingresa un monto válido mayor a 0.';
    }

    if (!isRequired(merchant)) {
      nextErrors.merchant =
        transactionType === 'gasto'
          ? 'El comercio es obligatorio.'
          : 'La descripción es obligatoria.';
    }

    if (!isRequired(category)) {
      nextErrors.category = 'Selecciona una categoría.';
    }

    if (!isRequired(bankAccount)) {
      nextErrors.bankAccount = 'Selecciona una cuenta bancaria.';
    }

    if (!isRequired(date)) {
      nextErrors.date = 'La fecha es obligatoria.';
    } else if (!isValidDate(date)) {
      nextErrors.date = 'Usa el formato DD/MM/AAAA.';
    }

    if (transactionType === 'gasto' && dueDate.trim() && !isValidDueDay(dueDate)) {
      nextErrors.dueDate = 'El día de vencimiento debe estar entre 1 y 31.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const parsedAmount = Number.parseFloat(amount.replace(',', '.'));
    const signedAmount = transactionType === 'gasto' ? -parsedAmount : parsedAmount;
    const dueDay = dueDate.trim() ? Number.parseInt(dueDate, 10) : new Date().getDate();
    const formattedDbDate = parseDDMMYYYYtoYYYYMMDD(date);
    const payload = {
      merchant: merchant.trim(),
      category: buildCategoryWithNotes(category, notes),
      bankAccount,
      amount: signedAmount,
      dueDate: dueDay,
      date: formattedDbDate,
    };

    try {
      if (isEditing && movimientoId) {
        await dispatch(
          updateMovimientoThunk({
            id: movimientoId,
            ...payload,
          })
        ).unwrap();

        Alert.alert('Cambios guardados', 'El movimiento se actualizó correctamente.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      await dispatch(addMovimientoThunk(payload)).unwrap();

      Alert.alert('Registro guardado', 'El movimiento fue procesado con éxito.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        isEditing ? 'No se pudo actualizar la transacción.' : 'No se pudo registrar la transacción.'
      );
    }
  };

  const handleDelete = () => {
    if (!movimientoId) {
      return;
    }

    Alert.alert(
      'Eliminar movimiento',
      'El movimiento se eliminará de forma permanente. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteMovimientoThunk(movimientoId)).unwrap();
              Alert.alert('Movimiento eliminado', 'El registro se eliminó correctamente.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el movimiento.');
            }
          },
        },
      ]
    );
  };

  if (isEditing && !existingMovement) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Editar registro" onBackPress={() => navigation.goBack()} />
        <Text variant="muted" style={styles.notFound}>
          No se encontró el movimiento solicitado.
        </Text>
      </SafeAreaView>
    );
  }

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
            title={isEditing ? 'Editar registro' : 'Nuevo registro'}
            onBackPress={() => navigation.goBack()}
          />

          <Tabs value={transactionType} onValueChange={handleTypeChange}>
            <TabsList>
              <TabsTrigger value="gasto" title="Gasto" />
              <TabsTrigger value="ingreso" title="Ingreso" />
            </TabsList>
          </Tabs>

          <View style={styles.form}>
            <FormField
              label="Monto (L)"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.amount}
              colors={colors}
            />

            <FormField
              label={transactionType === 'gasto' ? 'Comercio' : 'Descripción'}
              value={merchant}
              onChange={setMerchant}
              placeholder={
                transactionType === 'gasto' ? 'Ej. La Colonia' : 'Ej. Pago de salario'
              }
              error={errors.merchant}
              colors={colors}
            />

            <ChipSelector
              label="Categoría"
              options={categories}
              value={category}
              onChange={setCategory}
              error={errors.category}
              colors={colors}
            />

            <ChipSelector
              label="Cuenta bancaria"
              options={bankAccountOptions}
              value={bankAccount}
              onChange={setBankAccount}
              error={errors.bankAccount}
              colors={colors}
            />

            <FormField
              label="Fecha"
              value={date}
              onChange={setDate}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              error={errors.date}
              colors={colors}
            />

            {transactionType === 'gasto' ? (
              <FormField
                label="Día de vencimiento (opcional)"
                value={dueDate}
                onChange={setDueDate}
                placeholder="Ej. 18"
                keyboardType="numeric"
                error={errors.dueDate}
                colors={colors}
              />
            ) : null}

            <FormField
              label="Notas (opcional)"
              value={notes}
              onChange={setNotes}
              placeholder="Agrega un comentario adicional"
              multiline
              colors={colors}
            />
          </View>

          <CustomButton
            title={
              isEditing
                ? 'Guardar cambios'
                : transactionType === 'gasto'
                  ? 'Registrar gasto'
                  : 'Registrar ingreso'
            }
            onPress={handleSubmit}
          />

          {isEditing ? (
            <CustomButton title="Eliminar movimiento" variant="destructive" onPress={handleDelete} />
          ) : null}
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
      minHeight: 88,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: colors.destructive,
    },
    error: {
      fontSize: 12,
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
      marginTop: spacing.lg,
      gap: spacing.lg,
    },
    notFound: {
      textAlign: 'center',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
  });
