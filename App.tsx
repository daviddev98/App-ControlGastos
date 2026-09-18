import React from 'react';
import { LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import AppBootstrap from './src/components/AppBootstrap';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import ToastHost from './src/components/ToastHost';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import HistorialFlotante from './src/components/HistorialFlotante';
import { store } from './src/store';

LogBox.ignoreLogs([
  'WebCrypto API is not supported',
  'Code challenge method will default',
]);

void SplashScreen.preventAutoHideAsync();

const fallbackSafeAreaMetrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 24, left: 0, right: 0, bottom: 0 },
};

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics ?? fallbackSafeAreaMetrics}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <AppErrorBoundary>
                <AppBootstrap>
                  <AppNavigator />
                  <ToastHost />
                  <HistorialFlotante />
                </AppBootstrap>
              </AppErrorBoundary>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
