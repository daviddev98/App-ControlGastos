import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
  const { user, profileImageUri, saveProfileImage, clearProfileImage, signOut } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [isUploading, setIsUploading] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);

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

  const requestGalleryPermission = async (): Promise<boolean> => {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    let granted = current.granted;

    if (!granted && current.canAskAgain) {
      const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
      granted = requested.granted;
    }

    if (!granted) {
      Alert.alert(
        'Permiso requerido',
        'Para seleccionar una foto de tu galería, la aplicación necesita acceso a tus fotos. Puedes activarlo desde los ajustes de tu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return true;
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const current = await ImagePicker.getCameraPermissionsAsync();
    let granted = current.granted;

    if (!granted && current.canAskAgain) {
      const requested = await ImagePicker.requestCameraPermissionsAsync();
      granted = requested.granted;
    }

    if (!granted) {
      Alert.alert(
        'Permiso requerido',
        'Para tomar una foto de perfil, la aplicación necesita acceso a la cámara. Puedes activarlo desde los ajustes de tu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    return true;
  };

  const uploadAndSaveAvatar = async (imageUri: string) => {
    setIsUploading(true);
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
      Alert.alert('Éxito', 'Foto de perfil actualizada correctamente.');
    } catch (error) {
      console.error('Error al actualizar avatar en la nube:', error);

      try {
        await saveProfileImage(imageUri);
        Alert.alert('Aviso', 'La foto se guardó localmente en el dispositivo.');
      } catch {
        Alert.alert('Error', 'No se pudo actualizar la imagen de perfil.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickFromGallery = async () => {
    setShowPickerModal(false);
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await uploadAndSaveAvatar(result.assets[0].uri);
    }
  };

  const handleTakeWithCamera = async () => {
    setShowPickerModal(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await uploadAndSaveAvatar(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = () => {
    setShowPickerModal(false);
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro de que deseas eliminar tu foto de perfil actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await clearProfileImage();
            Alert.alert('Foto eliminada', 'Se ha restablecido el avatar por defecto.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Configuración" onBackPress={() => navigation.goBack()} />

        <View style={styles.profileSection}>
          <Pressable
            onPress={() => setShowPickerModal(true)}
            style={styles.avatarWrapper}
            disabled={isUploading}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
          >
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color={colors.mutedForeground} />
              </View>
            )}

            {isUploading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={12} color={colors.primaryForeground} />
              </View>
            )}
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
              <Text variant="muted">Cambia o actualiza tu imagen de perfil</Text>
            </View>
            <Pressable
              style={styles.profileButton}
              onPress={() => setShowPickerModal(true)}
              disabled={isUploading}
            >
              <Text variant="link">{isUploading ? 'Subiendo...' : 'Cambiar'}</Text>
            </Pressable>
          </CardContent>
        </Card>

        <Card style={styles.settingCard}>
          <CardContent style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="default" style={styles.settingTitle}>
                Red de categorías
              </Text>
              <Text variant="muted">Explora cómo se relacionan tus categorías</Text>
            </View>
            <Pressable
              style={styles.profileButton}
              onPress={() => navigation.navigate('RedCategorias')}
            >
              <Text variant="link">Abrir</Text>
            </Pressable>
          </CardContent>
        </Card>

        <Card style={styles.settingCard}>
          <CardContent style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="default" style={styles.settingTitle}>
                Asistente Financiero IA
              </Text>
              <Text variant="muted">Registra y analiza gastos en lenguaje natural</Text>
            </View>
            <Pressable
              style={styles.profileButton}
              onPress={() => navigation.navigate('AsistenteIA')}
            >
              <Text variant="link">Abrir</Text>
            </Pressable>
          </CardContent>
        </Card>

        <Text variant="muted" style={styles.themeHint}>
          Tema actual: {theme === 'dark' ? 'Oscuro' : 'Claro'}
        </Text>

        <CustomButton title="Cerrar sesión" onPress={handleLogout} variant="secondary" />
      </ScrollView>

      {/* Modal interactivo para opciones de foto de perfil */}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPickerModal(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text variant="title" style={styles.modalTitle}>
                Foto de perfil
              </Text>
              <Text variant="muted" style={styles.modalSubtitle}>
                Elige de dónde deseas obtener tu imagen
              </Text>
            </View>

            <View style={styles.modalOptions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalOptionItem,
                  pressed && { backgroundColor: colors.muted + '40' },
                ]}
                onPress={handleTakeWithCamera}
              >
                <View style={[styles.modalIconWrap, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name="camera-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.modalOptionTextWrap}>
                  <Text style={styles.modalOptionTitle}>Tomar foto</Text>
                  <Text variant="muted" style={styles.modalOptionDesc}>
                    Usar la cámara de tu teléfono
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalOptionItem,
                  pressed && { backgroundColor: colors.muted + '40' },
                ]}
                onPress={handlePickFromGallery}
              >
                <View style={[styles.modalIconWrap, { backgroundColor: colors.primary + '18' }]}>
                  <Ionicons name="images-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.modalOptionTextWrap}>
                  <Text style={styles.modalOptionTitle}>Elegir de la galería</Text>
                  <Text variant="muted" style={styles.modalOptionDesc}>
                    Seleccionar una foto existente
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>

              {profileImageUri ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.modalOptionItem,
                    pressed && { backgroundColor: colors.muted + '40' },
                  ]}
                  onPress={handleRemovePhoto}
                >
                  <View style={[styles.modalIconWrap, { backgroundColor: colors.destructive + '18' }]}>
                    <Ionicons name="trash-outline" size={22} color={colors.destructive} />
                  </View>
                  <View style={styles.modalOptionTextWrap}>
                    <Text style={[styles.modalOptionTitle, { color: colors.destructive }]}>
                      Eliminar foto
                    </Text>
                    <Text variant="muted" style={styles.modalOptionDesc}>
                      Restablecer imagen por defecto
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setShowPickerModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: radius.full,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      padding: spacing.md,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    modalHeader: {
      gap: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
    },
    modalSubtitle: {
      fontSize: 13,
    },
    modalOptions: {
      gap: spacing.xs,
    },
    modalOptionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      gap: spacing.md,
    },
    modalIconWrap: {
      width: 42,
      height: 42,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOptionTextWrap: {
      flex: 1,
      gap: 2,
    },
    modalOptionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
    },
    modalOptionDesc: {
      fontSize: 12,
    },
    modalCancelButton: {
      backgroundColor: colors.secondary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    modalCancelText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
    },
  });

