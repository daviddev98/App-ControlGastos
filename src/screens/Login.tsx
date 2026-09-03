import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CustomButton from '../components/CustomButton';
import CustomInput from '../components/CustomInput';
import { Text } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';
import {
  hasValidDomain,
  isRequired,
  isValidEmail,
  isValidPassword,
} from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type FormErrors = {
  usuario?: string;
  password?: string;
};

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!isRequired(usuario)) {
      nextErrors.usuario = 'El correo es obligatorio.';
    } else if (!isValidEmail(usuario)) {
      nextErrors.usuario = 'Ingresa un correo electrónico válido.';
    } else if (!hasValidDomain(usuario)) {
      nextErrors.usuario =
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const { error } = await signInWithPassword(usuario, password);

    if (error) {
      Alert.alert(
        'Error de inicio de sesión',
        'El correo o la contraseña son incorrectos, o la cuenta aún no ha sido registrada.'
      );
      return;
    }

    navigation.replace('MainTabs');
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);

    const { error, success } = await signInWithGoogle();

    setLoadingGoogle(false);

    if (error) {
      Alert.alert('Error de autenticación', error);
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
          Iniciar sesión
        </Text>

        <CustomInput
          type="email"
          placeholder="Correo electrónico"
          value={usuario}
          onChange={setUsuario}
          error={errors.usuario}
        />

        <CustomInput
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />

        <View style={styles.buttonGap}>
          <CustomButton title="Entrar" onPress={handleSubmit} />

          <CustomButton
            title={loadingGoogle ? 'Cargando Google...' : 'Iniciar sesión con Google'}
            onPress={handleGoogleLogin}
          />
        </View>

        <Text
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 14,
            textDecorationLine: 'underline',
            color: colors.foreground,
          }}
          onPress={() => navigation.navigate('Register')}
        >
          ¿No tienes cuenta? Regístrate aquí
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
});
