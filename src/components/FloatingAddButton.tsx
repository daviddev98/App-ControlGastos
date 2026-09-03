import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, shadows } from '../constants/theme';

const BUTTON_COLOR = '#38BDF8';
const ICON_COLOR = '#000000';

type Props = {
  onPress?: () => void;
};

export default function FloatingAddButton({ onPress }: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Ionicons name="add" size={28} color={ICON_COLOR} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 24,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: BUTTON_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
});
