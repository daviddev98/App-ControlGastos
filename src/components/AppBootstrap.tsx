import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type Props = {
  children: React.ReactNode;
};

export default function AppBootstrap({ children }: Props) {
  const { isLoading: authLoading } = useAuth();
  const { isReady: themeReady, colors } = useTheme();

  if (authLoading || !themeReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
