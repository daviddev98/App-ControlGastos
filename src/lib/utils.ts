import { StyleProp, ViewStyle } from 'react-native';

export function cn(...styles: (StyleProp<ViewStyle> | false | undefined | null)[]) {
  return styles.filter(Boolean);
}
