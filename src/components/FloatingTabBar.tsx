import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadows } from '../constants/theme';
import { MainTabParamList } from '../types/navigation';
import { Text } from './ui';

type TabKey = keyof MainTabParamList;

const TAB_CONFIG: Record<
  TabKey,
  { label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }
> = {
  Metas: { label: 'Metas', icon: 'flag-outline', activeIcon: 'flag' },
  Inicio: { label: 'Inicio', icon: 'home-outline', activeIcon: 'home' },
  Cuentas: { label: 'Cuentas', icon: 'wallet-outline', activeIcon: 'wallet' },
};

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tabKey = route.name as TabKey;
          const config = TAB_CONFIG[tabKey];
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <Ionicons
                name={isFocused ? config.activeIcon : config.icon}
                size={18}
                color={isFocused ? colors.foreground : colors.muted}
              />
              {isFocused ? (
                <Text variant="default" style={styles.activeLabel}>
                  {config.label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tabBar,
    borderRadius: radius.full,
    padding: 8,
    gap: 6,
    ...shadows.card,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    gap: 6,
    minWidth: 44,
  },
  tabActive: {
    backgroundColor: colors.tabBarActive,
  },
  activeLabel: {
    color: colors.card,
    fontWeight: '600',
    fontSize: 13,
  },
});
