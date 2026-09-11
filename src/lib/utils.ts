import { StyleProp, TextStyle, ViewStyle } from 'react-native';

export function cn(...styles: (StyleProp<ViewStyle | TextStyle> | false | undefined | null)[]) {
  return styles.filter(Boolean);
}
