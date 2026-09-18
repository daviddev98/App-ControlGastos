import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const logo = require('../../assets/images/logo.png');
const MIN_SPLASH_MS = 1400;

type Props = {
  children: React.ReactNode;
};

export default function AppBootstrap({ children }: Props) {
  const { isLoading: authLoading } = useAuth();
  const { isReady: themeReady } = useTheme();
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, MIN_SPLASH_MS);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const isBooting = authLoading || !themeReady || !minTimePassed;

  useEffect(() => {
    if (!isBooting) {
      void SplashScreen.hideAsync();
    }
  }, [isBooting]);

  if (isBooting) {
    return (
      <View style={styles.loading}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator size="large" color="#3B82F6" style={styles.spinner} />
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
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 200,
    height: 200,
  },
  spinner: {
    marginTop: 24,
  },
});
