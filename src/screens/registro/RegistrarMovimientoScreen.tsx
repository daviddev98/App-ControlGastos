import React, { useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  addMovimientoThunk,
  deleteMovimientoThunk,
  fetchAccountsThunk,
  updateMovimientoThunk,
} from '../../store/slices/financeSlice';
import { mostrarPanelHistorial } from '../../store/slices/uiSlice';
import CustomButton from '../../components/CustomButton';
import ReceiptPickerField from '../../components/ReceiptPickerField';
import ScreenHeader from '../../components/ScreenHeader';
import { Tabs, TabsList, TabsTrigger, Text } from '../../components/ui';
import {
  deleteReceiptLocally,
  getReceiptUri,
  saveReceiptLocally,
} from '../../services/receiptStorage';
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

type ComboBoxProps = {
  label: string;
  placeholder?: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  colors: ThemeColors;
};

function ComboBox({
  label,
  placeholder = 'Selecciona una opción',
  options,
  value,
  onChange,
  error,
  colors,
}: ComboBoxProps) {
  const styles = useMemo(() => createFieldStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text variant="label" style={styles.label}>
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.comboTrigger, error && styles.inputError]}
      >
        <Text
          style={[styles.comboValue, !value && styles.comboPlaceholder]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>
      {error ? (
        <Text variant="destructive" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.comboOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.comboSheet}>
            <Text variant="subtitle" style={styles.comboSheetTitle}>
              {label}
            </Text>
            <ScrollView
              style={styles.comboList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => {
                const selected = option === value;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    style={[styles.comboOption, selected && styles.comboOptionSelected]}
                  >
                    <Text
                      style={[styles.comboOptionText, selected && styles.comboOptionTextSelected]}
                    >
                      {option}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function RegistrarMovimientoScreen({ navigation, route }: Props) {
  const movimientoId = route.params?.movimientoId;
  const isEditing = Boolean(movimientoId);
  const dispatch = useAppDispatch();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const existingMovement = useAppSelector((state) =>
    selectMovimientoById(state, movimientoId ?? '')
  );
  const accounts = useAppSelector(selectAccounts);

  const [transactionType, setTransactionType] = useState<TransactionType>('gasto');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [date, setDate] = useState(formatToday());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    dispatch(fetchAccountsThunk());
  }, [dispatch]);

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
    setReceiptUri(existingMovement.receiptUri ?? null);
    setErrors({});

    let cancelled = false;
    void getReceiptUri(existingMovement.id).then((uri) => {
      if (!cancelled && uri) {
        setReceiptUri(uri);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [existingMovement]);

  useEffect(() => {
    if (!existingMovement && route.params?.initialData) {
      const init = route.params.initialData;
      if (init.transactionType) setTransactionType(init.transactionType);
      if (init.amount !== undefined && init.amount > 0) setAmount(String(init.amount));
      if (init.merchant) setMerchant(init.merchant);
      if (init.category) setCategory(init.category);
      if (init.notes) setNotes(init.notes);
    }
  }, [existingMovement, route.params?.initialData]);

  const bankAccountOptions = useMemo(() => {
    const accountNames = [...new Set(accounts.map((account) => account.name).filter(Boolean))];
    const baseOptions = accountNames.length > 0 ? accountNames : [...BANK_ACCOUNTS];
    return [...new Set([...baseOptions, bankAccount].filter(Boolean))];
  }, [accounts, bankAccount]);

  const categories = useMemo(() => {
    const base =
      transactionType === 'gasto' ? [...EXPENSE_CATEGORIES] : [...INCOME_CATEGORIES];
    return [...new Set([...base, category].filter(Boolean))];
  }, [transactionType, category]);

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

    if (transactionType === 'ingreso' && !isRequired(merchant)) {
      nextErrors.merchant = 'La descripción es obligatoria.';
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
      merchant:
        merchant.trim() ||
        (transactionType === 'gasto' ? category : merchant.trim()),
      category: buildCategoryWithNotes(category, notes),
      bankAccount,
      amount: signedAmount,
      dueDate: dueDay,
      date: formattedDbDate,
    };

    try {
      let savedId = movimientoId;

      if (isEditing && movimientoId) {
        await dispatch(
          updateMovimientoThunk({
            id: movimientoId,
            ...payload,
          })
        ).unwrap();
      } else {
        const created = await dispatch(addMovimientoThunk(payload)).unwrap();
        savedId = created.id;
      }

      if (savedId) {
        try {
          if (transactionType === 'gasto' && receiptUri) {
            await saveReceiptLocally(savedId, receiptUri);
          } else if (!isEditing) {
            await deleteReceiptLocally(savedId);
          }
        } catch {
          Alert.alert(
            isEditing ? 'Cambios guardados' : 'Registro guardado',
            'El movimiento se guardó, pero no se pudo guardar el comprobante en el teléfono.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
      }

      Alert.alert(
        isEditing ? 'Cambios guardados' : 'Registro guardado',
        isEditing
          ? 'El movimiento se actualizó correctamente.'
          : 'El movimiento fue procesado con éxito.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
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
      'El movimiento se quitará de tus registros. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteMovimientoThunk(movimientoId)).unwrap();
              dispatch(mostrarPanelHistorial());
              navigation.goBack();
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
              label={transactionType === 'gasto' ? 'Comercio (opcional)' : 'Descripción'}
              value={merchant}
              onChange={setMerchant}
              placeholder={
                transactionType === 'gasto' ? 'Ej. La Colonia' : 'Ej. Pago de salario'
              }
              error={errors.merchant}
              colors={colors}
            />

            <ComboBox
              label="Categoría"
              placeholder="Selecciona una categoría"
              options={categories}
              value={category}
              onChange={setCategory}
              error={errors.category}
              colors={colors}
            />

            <ComboBox
              label="Cuenta bancaria"
              placeholder="Selecciona una cuenta"
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

            {transactionType === 'gasto' ? (
              <ReceiptPickerField
                uri={receiptUri}
                onChange={setReceiptUri}
                colors={colors}
                allowRemove={!isEditing}
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
    comboTrigger: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    comboValue: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
    },
    comboPlaceholder: {
      color: colors.muted,
    },
    comboOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    comboSheet: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: '70%',
      paddingVertical: spacing.md,
    },
    comboSheetTitle: {
      fontSize: 16,
      fontWeight: '700',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    comboList: {
      maxHeight: 360,
    },
    comboOption: {
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    comboOptionSelected: {
      backgroundColor: colors.secondary,
    },
    comboOptionText: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
    },
    comboOptionTextSelected: {
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
