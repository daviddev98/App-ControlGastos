import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppSettings } from '../../hooks/useAppSettings';

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function Switch({ checked, onCheckedChange, disabled = false }: Props) {
  const { colors } = useAppSettings();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      style={[
        styles.track,
        {
          backgroundColor: checked ? colors.primary : colors.switchTrack,
          borderColor: colors.border,
        },
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: colors.switchThumb,
            transform: [{ translateX: checked ? 20 : 2 }],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
