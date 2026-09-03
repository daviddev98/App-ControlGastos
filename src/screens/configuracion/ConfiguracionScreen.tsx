import React, { useMemo } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import ScreenHeader from '../../components/ScreenHeader';
import CustomButton from '../../components/CustomButton';
import { Card, CardContent, Switch, Text } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/themes';
import { radius, spacing } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '../../services/supabaseClient';

type Props = NativeStackScreenProps<RootStackParamList, 'Configuracion'>;

export default function ConfiguracionScreen({ navigation }: Props) {
  const rootNavigation = useNavigation();
  const { colors, isDark, theme, setTheme } = useTheme();
  const { user, profileImageUri, saveProfileImage, signOut } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          const { error } = await signOut();

          if (error) {
            Alert.alert('Error', 'No se pudo cerrar la sesión correctamente.');
            return;
          }

          rootNavigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        },
      },
    ]);
  };

  const handlePickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const imageUri = result.assets[0].uri;

      try {
        if (!user) throw new Error('Usuario no encontrado');

        const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
        const filePath = `${user.id}/avatar.${fileExt}`;

        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });

        const arrayBuffer = decode(base64Data);

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            upsert: true,
            contentType: mimeType,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath);

        const freshUrl = `${publicUrl}?t=${new Date().getTime()}`;

        await saveProfileImage(freshUrl);
        Alert.alert('Éxito', 'Foto de perfil actualizada en la nube.');
      } catch (error) {
        console.error('Error crítico en subida Base64:', error);

        try {
          await saveProfileImage(imageUri);
          Alert.alert('Aviso', 'La foto se guardó localmente en el dispositivo.');
        } catch {
          Alert.alert('Error', 'No se pudo actualizar la imagen de perfil.');
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Configuración" onBackPress={() => navigation.goBack()} />

        <View style={styles.profileSection}>
          <Pressable onPress={handlePickProfileImage} style={styles.avatarWrapper}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color={colors.mutedForeground} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={12} color={colors.primaryForeground} />
            </View>
          </Pressable>

          <Text variant="default" style={styles.email}>
            {user?.email || 'Sin correo registrado'}
          </Text>
        </View>

        <Card style={styles.settingCard}>
          <CardContent style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="default" style={styles.settingTitle}>
                Modo oscuro
              </Text>
              <Text variant="muted">Cambia la apariencia de la aplicación</Text>
            </View>
            <Switch
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </CardContent>
        </Card>

        <Card style={styles.settingCard}>
          <CardContent style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="default" style={styles.settingTitle}>
                Foto de perfil
              </Text>
              <Text variant="muted">Selecciona una imagen desde tu galería</Text>
            </View>
            <Pressable style={styles.profileButton} onPress={handlePickProfileImage}>
              <Text variant="link">Cambiar</Text>
            </Pressable>
          </CardContent>
        </Card>

        <Text variant="muted" style={styles.themeHint}>
          Tema actual: {theme === 'dark' ? 'Oscuro' : 'Claro'}
        </Text>

        <CustomButton title="Cerrar sesión" onPress={handleLogout} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      gap: spacing.sm,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: radius.full,
      borderWidth: 2,
      borderColor: colors.border,
    },
    avatarPlaceholder: {
      width: 72,
      height: 72,
      borderRadius: radius.full,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    editBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.foreground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    email: {
      fontSize: 14,
      fontWeight: '500',
    },
    settingCard: {
      marginBottom: spacing.md,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingTop: spacing.md,
    },
    settingInfo: {
      flex: 1,
      gap: 4,
    },
    settingTitle: {
      fontWeight: '600',
    },
    profileButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    themeHint: {
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
  });
