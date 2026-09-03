import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function useAppSettings() {
  const { colors, theme, isDark, isReady, setTheme, toggleTheme } = useTheme();
  const { user, profileImageUri, saveProfileImage } = useAuth();

  return {
    colors,
    theme,
    isDark,
    isReady,
    email: user?.email ?? '',
    profileImageUri,
    setTheme,
    toggleTheme,
    saveProfileImage,
  };
}
