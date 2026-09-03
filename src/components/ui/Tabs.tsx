import React, { createContext, useContext, useMemo } from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';

import { useAppSettings } from '../../hooks/useAppSettings';
import { ThemeColors } from '../../constants/themes';
import { radius, shadows } from '../../constants/theme';
import { cn } from '../../lib/utils';
import { Text } from './Text';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  style?: ViewProps['style'];
};

export function Tabs({ value, onValueChange, children, style }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <View style={style}>{children}</View>
    </TabsContext.Provider>
  );
}

export function TabsList({ style, ...props }: ViewProps) {
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={cn(styles.list, style)} {...props} />;
}

type TabsTriggerProps = {
  value: string;
  title: string;
};

export function TabsTrigger({ value, title }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!context) {
    throw new Error('TabsTrigger debe usarse dentro de Tabs');
  }

  const isActive = context.value === value;

  return (
    <Pressable
      onPress={() => context.onValueChange(value)}
      style={cn(styles.trigger, isActive && styles.triggerActive)}
    >
      <Text
        variant="default"
        style={isActive ? styles.triggerTextActive : styles.triggerText}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  const { colors } = useAppSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!context || context.value !== value) {
    return null;
  }

  return <View style={styles.content}>{children}</View>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: {
      flexDirection: 'row',
      backgroundColor: colors.secondary,
      borderRadius: radius.full,
      padding: 4,
      gap: 4,
    },
    trigger: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: radius.full,
    },
    triggerActive: {
      backgroundColor: colors.card,
      ...shadows.soft,
    },
    triggerText: {
      color: colors.mutedForeground,
      fontWeight: '500',
      fontSize: 12,
    },
    triggerTextActive: {
      color: colors.foreground,
      fontWeight: '700',
      fontSize: 12,
    },
    content: {
      marginTop: 16,
      gap: 12,
    },
  });
