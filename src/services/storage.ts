import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  THEME: '@app_theme',
  USER_EMAIL: '@user_email',
  PROFILE_IMAGE: '@profile_image',
} as const;

export type ThemeMode = 'light' | 'dark';

export async function getStoredTheme(): Promise<ThemeMode> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
  return value === 'dark' ? 'dark' : 'light';
}

export async function setStoredTheme(theme: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
}

export async function getStoredEmail(): Promise<string> {
  return (await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL)) ?? '';
}

export async function setStoredEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
}

export async function getStoredProfileImage(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE);
}

export async function setStoredProfileImage(uri: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, uri);
}
