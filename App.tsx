import React from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import AppBootstrap from './src/components/AppBootstrap';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import ToastHost from './src/components/ToastHost';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import { store } from './src/store';

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
                </AppBootstrap>
              </AppErrorBoundary>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
