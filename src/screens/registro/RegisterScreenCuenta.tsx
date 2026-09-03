import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { Text } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';
import {
  hasValidDomain,
  isRequired,
  isValidEmail,
  isValidPassword,
} from '../../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

type FormErrors = {
  name?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
};

export default function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!isRequired(name)) {
      nextErrors.name = 'El nombre completo es obligatorio.';
    }

    if (!isRequired(phoneNumber)) {
      nextErrors.phoneNumber = 'El número de teléfono es obligatorio.';
    }

    if (!isRequired(email)) {
      nextErrors.email = 'El correo es obligatorio.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Ingresa un correo electrónico válido.';
    } else if (!hasValidDomain(email)) {
      nextErrors.email =
        'El correo debe ser @gmail.com, @unitec.edu, @hotmail.com o @outlook.com.';
    }

    if (!isRequired(password)) {
      nextErrors.password = 'La contraseña es obligatoria.';
    } else if (!isValidPassword(password)) {
      nextErrors.password = 'La contraseña debe tener más de 8 caracteres.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const { error } = await signUp(email, password, {
      fullName: name,
      phoneNumber,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error al registrarse', error);
      return;
    }

    Alert.alert(
      '¡Registro exitoso!',
      'Tu cuenta fue creada correctamente. Revisa tu correo si se requiere confirmación.',
      [
        {
          text: 'Ir a Iniciar sesión',
          onPress: () => navigation.navigate('Login'),
        },
      ]
    );
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);

    const { error, success } = await signInWithGoogle();

    setLoading(false);

    if (error) {
      Alert.alert('Error con Google', error);
      return;
    }

    if (success) {
      navigation.replace('MainTabs');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text variant="subtitle" style={styles.title}>
          Crear cuenta
        </Text>

        <CustomInput
          type="default"
          placeholder="Nombre completo"
          value={name}
          onChange={setName}
          error={errors.name}
        />

        <CustomInput
          type="number"
          placeholder="Número de teléfono"
          value={phoneNumber}
          onChange={setPhoneNumber}
          error={errors.phoneNumber}
        />

        <CustomInput
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />

        <CustomInput
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />

        <View style={styles.buttonGap}>
          <CustomButton
            title={loading ? 'Registrando...' : 'Registrarse'}
            onPress={handleRegister}
          />

          <CustomButton title="Registrarse con Google" onPress={handleGoogleSignUp} />
        </View>

        <Text
          style={[styles.linkText, { color: colors.foreground }]}
          onPress={() => navigation.navigate('Login')}
        >
          ¿Ya tienes cuenta? Inicia sesión aquí
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 320,
    padding: spacing.xl,
    gap: 14,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonGap: {
    gap: 10,
    marginTop: 6,
  },
  linkText: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
