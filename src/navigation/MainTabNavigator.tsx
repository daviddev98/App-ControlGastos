import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import FloatingAddButton from '../components/FloatingAddButton';
import FloatingTabBar from '../components/FloatingTabBar';
import CuentasScreen from '../screens/cuentas/CuentasScreen';
import InicioScreen from '../screens/main/InicioScreen';
import MetasScreen from '../screens/metas/MetasScreen';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Inicio"
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Metas" component={MetasScreen} />
        <Tab.Screen name="Inicio" component={InicioScreen} />
        <Tab.Screen name="Cuentas" component={CuentasScreen} />
      </Tab.Navigator>

      <FloatingAddButton onPress={() => navigation.navigate('RegistroMovimiento')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
