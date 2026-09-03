import React, { useMemo, useState } from 'react';
import {
  TextInput,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import { useAppSettings } from '../hooks/useAppSettings';
import { ThemeColors } from '../constants/themes';

type Props = {
  type?: 'text' | 'email' | 'password' | 'default' | 'number';
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  error?: string;
};

export default function CustomInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
}: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isSecureText, setIsSecureText] = useState(type === 'password');
  const isPasswordField = type === 'password';

  const icon: keyof typeof MaterialIcons.glyphMap | undefined =
    type === 'email' ? 'alternate-email' : type === 'password' ? 'lock' : undefined;

  const keyboardType: KeyboardTypeOptions = type === 'email' ? 'email-address' : 'default';

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inputContainer, error ? styles.inputError : undefined]}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={colors.mutedForeground}
            style={styles.icon}
          />
        )}

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChange}
          style={styles.input}
          secureTextEntry={isSecureText}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />

        {isPasswordField && (
          <TouchableOpacity onPress={() => setIsSecureText(!isSecureText)} style={styles.iconRight}>
            <Ionicons
              name={isSecureText ? 'eye' : 'eye-off'}
              size={20}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 4,
      width: '100%',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 4,
    },
    inputError: {
      borderBottomColor: colors.destructive,
    },
    icon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      paddingVertical: 6,
    },
    iconRight: {
      padding: 4,
    },
    errorText: {
      color: colors.destructive,
      fontSize: 12,
      marginTop: 4,
    },
  });
