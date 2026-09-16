import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing } from '../constants/theme';
import { Text } from './ui';

export default function ToastHost() {
  const { toast, hideToast } = useToast();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (!toast) {
      return;
    }

    opacity.setValue(0);
    translateY.setValue(-12);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    const hideTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (finished) {
          hideToast();
        }
      });
    }, toast.durationMs);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [toast, hideToast, opacity, translateY]);

  const backgroundColor = useMemo(() => {
    if (!toast) {
      return colors.card;
    }
    return toast.variant === 'error' ? '#B91C1C' : '#15803D';
  }, [toast, colors]);

  if (!toast) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.toast,
          {
            top: Math.max(insets.top, 12) + 8,
            backgroundColor,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text variant="default" style={styles.message}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
  },
  toast: {
    position: 'absolute',
    maxWidth: 360,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
