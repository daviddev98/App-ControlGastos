import React, { useMemo, useState } from 'react';
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
import { createNewAccountThunk } from '../../store/slices/financeSlice';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { Text } from '../../components/ui';
import {
  ACCOUNT_TYPES,
  AccountType,
  CARD_BRANDS,
  CardBrand,
} from '../../constants/sampleData';
import { radius, spacing } from '../../constants/theme';
import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { useAppDispatch } from '../../store/hooks';
import { addAccount } from '../../store/slices/financeSlice';
import { RootStackParamList } from '../../types/navigation';
import { isRequired, isValidAmount } from '../../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevaCuenta'>;

type FormErrors = Partial<Record<'name' | 'subtitle' | 'balance' | 'brand', string>>;

const CHART_COLORS = ['#F59E0B', '#EF4444', '#22C55E', '#3B82F6', '#A855F7', '#EC4899', '#14B8A6'];

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'decimal-pad';
  colors: ThemeColors;
};

function FormField({
  label,
  value,
  onChange,
  placeholder,
  error,
  keyboardType = 'default',
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
        style={[styles.input, error && styles.inputError]}
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
  options: { value: T; label: string }[];
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

export default function NuevaCuentaScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [balance, setBalance] = useState('');
  const [brand, setBrand] = useState<CardBrand>('mastercard');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!isRequired(name)) {
      nextErrors.name = 'El nombre es obligatorio.';
    }

    if (!isRequired(subtitle)) {
      nextErrors.subtitle = 'La descripción es obligatoria.';
    }

    if (!isRequired(balance)) {
      nextErrors.balance = 'El saldo es obligatorio.';
    } else if (!isValidAmount(balance)) {
      nextErrors.balance = 'Ingresa un saldo válido mayor a 0.';
    }

    if (accountType === 'credit_card' && !brand) {
      nextErrors.brand = 'Selecciona la marca de la tarjeta.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (!validateForm()) return;

  const parsedBalance = Number.parseFloat(balance.replace(',', '.'));
  const colorIndex = Math.floor(Math.random() * CHART_COLORS.length);

  try {
  await dispatch(createNewAccountThunk({
    name: name.trim(),
    subtitle: subtitle.trim(),
    type: accountType,
    balance: parsedBalance,
    color: CHART_COLORS[colorIndex],
    ...(accountType === 'credit_card' ? { brand } : {}),
  })).unwrap();

  Alert.alert('Cuenta creada', 'La cuenta se guardó en la base de datos.', [
    { text: 'OK', onPress: () => navigation.goBack() },
  ]);
} catch (error) {
  Alert.alert('Error', 'No se pudo guardar la cuenta de ahorros.');
}
};

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
          <ScreenHeader title="Nueva cuenta" onBackPress={() => navigation.goBack()} />

          <View style={styles.form}>
            <ChipSelector
              label="Tipo de cuenta"
              options={ACCOUNT_TYPES}
              value={accountType}
              onChange={setAccountType}
              colors={colors}
            />

            <FormField
              label="Nombre"
              value={name}
              onChange={setName}
              placeholder="Ej. Banpais, BAC, Efectivo"
              error={errors.name}
              colors={colors}
            />

            <FormField
              label="Descripción"
              value={subtitle}
              onChange={setSubtitle}
              placeholder="Ej. Cuenta planilla, Tarjeta crédito"
              error={errors.subtitle}
              colors={colors}
            />

            <FormField
              label={accountType === 'credit_card' ? 'Saldo utilizado (L)' : 'Saldo (L)'}
              value={balance}
              onChange={setBalance}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.balance}
              colors={colors}
            />

            {accountType === 'credit_card' ? (
              <ChipSelector
                label="Marca de tarjeta"
                options={CARD_BRANDS}
                value={brand}
                onChange={setBrand}
                error={errors.brand}
                colors={colors}
              />
            ) : null}
          </View>

          <CustomButton title="Crear cuenta" onPress={handleSubmit} />
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
      marginTop: spacing.md,
      gap: spacing.lg,
    },
  });
