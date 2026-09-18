import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  THEME: '@app_theme',
  USER_EMAIL: '@user_email',
  PROFILE_IMAGE_PREFIX: '@profile_image_',
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

export function getUserProfileImageKey(userId: string): string {
  return `${STORAGE_KEYS.PROFILE_IMAGE_PREFIX}${userId}`;
}

export async function getStoredProfileImage(userId?: string | null): Promise<string | null> {
  if (!userId) return null;
  return AsyncStorage.getItem(getUserProfileImageKey(userId));
}

export async function setStoredProfileImage(userId: string, uri: string): Promise<void> {
  if (!userId) return;
  if (!uri) {
    await AsyncStorage.removeItem(getUserProfileImageKey(userId));
  } else {
    await AsyncStorage.setItem(getUserProfileImageKey(userId), uri);
  }
}

