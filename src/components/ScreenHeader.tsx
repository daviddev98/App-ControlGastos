import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppSettings } from '../hooks/useAppSettings';
import { Button, Text } from './ui';

type Props = {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  onAIAssistantPress?: () => void;
};

export default function ScreenHeader({
  title,
  showBack = true,
  onBackPress,
  onSettingsPress,
  onAIAssistantPress,
}: Props) {
  const { colors } = useAppSettings();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        },
        title: {
          flex: 1,
          textAlign: 'center',
          fontSize: 22,
        },
        placeholder: {
          width: 40,
        },
        rightActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
      }),
    []
  );

  return (
    <View style={styles.container}>
      {showBack ? (
        <Button variant="outline" size="icon" onPress={onBackPress}>
          <Ionicons name="arrow-back" size={18} color={colors.foreground} />
        </Button>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text variant="subtitle" style={styles.title}>
        {title}
      </Text>

      <View style={styles.rightActions}>
        {onAIAssistantPress ? (
          <Button
            variant="outline"
            size="icon"
            onPress={onAIAssistantPress}
            accessibilityLabel="Abrir Asistente IA"
          >
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </Button>
        ) : null}

        {onSettingsPress ? (
          <Button variant="outline" size="icon" onPress={onSettingsPress}>
            <Ionicons name="settings-outline" size={18} color={colors.foreground} />
          </Button>
        ) : !onAIAssistantPress ? (
          <View style={styles.placeholder} />
        ) : null}
      </View>
    </View>
  );
}
