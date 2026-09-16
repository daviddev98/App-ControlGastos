import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth, useTheme } from '../context';
import ConfiguracionScreen from '../screens/configuracion/ConfiguracionScreen';
import CuentasDetalleScreen from '../screens/cuentas/CuentasDetalleScreen';
import NuevaCuentaScreen from '../screens/cuentas/NuevaCuentaScreen';
import LoginScreen from '../screens/Login';
import MetaFormScreen from '../screens/metas/MetaFormScreen';
import RegisterScreen from '../screens/registro/RegisterScreenCuenta';
import RegistrarMovimientoScreen from '../screens/registro/RegistrarMovimientoScreen';
import RedCategoriasScreen from '../screens/categorias/RedCategoriasScreen';
import { RootStackParamList } from '../types/navigation';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();
const isLegacyAndroid = Platform.OS === 'android' && Number(Platform.Version) < 29;

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();
  const { colors, isDark } = useTheme();
  const navigationTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: isLegacyAndroid ? 'none' : 'slide_from_right',
          contentStyle: { backgroundColor: colors.background, flex: 1 },
        }}
      >
        {isAuthenticated ? (
          // RUTA PRIVADA: Se muestra automáticamente al iniciar sesión
          <Stack.Group>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
            <Stack.Screen name="RegistroMovimiento" component={RegistrarMovimientoScreen} />
            <Stack.Screen name="CuentasDetalle" component={CuentasDetalleScreen} />
            <Stack.Screen name="NuevaCuenta" component={NuevaCuentaScreen} />
            <Stack.Screen name="MetaForm" component={MetaFormScreen} />
            <Stack.Screen name="RedCategorias" component={RedCategoriasScreen} />
          </Stack.Group>
        ) : (
          // RUTA PÚBLICA
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
