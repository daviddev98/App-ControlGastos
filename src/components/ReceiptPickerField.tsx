import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors } from '../constants/themes';
import { radius, spacing } from '../constants/theme';
import { Text } from './ui';

type Props = {
  uri: string | null;
  onChange: (uri: string | null) => void;
  colors: ThemeColors;
  allowRemove?: boolean;
};

async function pickFromLibrary(): Promise<string | null> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  let granted = current.granted;

  if (!granted && current.canAskAgain) {
    const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
    granted = requested.granted;
  }

  if (!granted) {
    Alert.alert(
      'Permiso requerido',
      'Necesitamos acceso a tus fotos para adjuntar el comprobante. Por favor, actívalo en los ajustes de tu dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
      ]
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });

  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

async function pickFromCamera(): Promise<string | null> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  let granted = current.granted;

  if (!granted && current.canAskAgain) {
    const requested = await ImagePicker.requestCameraPermissionsAsync();
    granted = requested.granted;
  }

  if (!granted) {
    Alert.alert(
      'Permiso requerido',
      'Necesitamos la cámara para fotografiar la factura o el comprobante. Por favor, actívala en los ajustes de tu dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
      ]
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });

  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

export default function ReceiptPickerField({
  uri,
  onChange,
  colors,
  allowRemove = true,
}: Props) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [fullScreen, setFullScreen] = useState(false);

  const handleLibrary = async () => {
    const nextUri = await pickFromLibrary();
    if (nextUri) {
      onChange(nextUri);
    }
  };

  const handleCamera = async () => {
    const nextUri = await pickFromCamera();
    if (nextUri) {
      onChange(nextUri);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text variant="label" style={styles.label}>
        {allowRemove ? 'Comprobante (opcional)' : 'Comprobante'}
      </Text>
      <Text variant="muted" style={styles.hint}>
        {uri
          ? 'Toca la foto para verla en pantalla completa.'
          : 'Foto de la factura. Se guarda solo en este teléfono.'}
      </Text>

      {uri ? (
        <View style={styles.previewCard}>
          <Pressable
            onPress={() => setFullScreen(true)}
            accessibilityRole="imagebutton"
            accessibilityLabel="Ver comprobante en pantalla completa"
          >
            <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          </Pressable>
          {allowRemove ? (
            <View style={styles.previewActions}>
              <Pressable
                onPress={handleCamera}
                style={styles.previewAction}
                accessibilityRole="button"
                accessibilityLabel="Volver a tomar foto"
              >
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                <Text style={styles.previewActionText}>Cámara</Text>
              </Pressable>
              <Pressable
                onPress={handleLibrary}
                style={styles.previewAction}
                accessibilityRole="button"
                accessibilityLabel="Elegir otra foto"
              >
                <Ionicons name="image-outline" size={18} color={colors.primary} />
                <Text style={styles.previewActionText}>Galería</Text>
              </Pressable>
              <Pressable
                onPress={() => onChange(null)}
                style={styles.previewAction}
                accessibilityRole="button"
                accessibilityLabel="Quitar comprobante"
              >
                <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                <Text style={[styles.previewActionText, styles.removeText]}>Quitar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={handleCamera}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Tomar foto del comprobante"
          >
            <Ionicons name="camera-outline" size={20} color={colors.foreground} />
            <Text style={styles.actionTitle}>Cámara</Text>
            <Text variant="muted" style={styles.actionSubtitle}>
              Tomar foto
            </Text>
          </Pressable>
          <Pressable
            onPress={handleLibrary}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel="Elegir foto de la galería"
          >
            <Ionicons name="image-outline" size={20} color={colors.foreground} />
            <Text style={styles.actionTitle}>Galería</Text>
            <Text variant="muted" style={styles.actionSubtitle}>
              Subir foto
            </Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={fullScreen && Boolean(uri)}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setFullScreen(false)}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.fullScreen}>
          <Pressable style={styles.fullScreenImageWrap} onPress={() => setFullScreen(false)}>
            {uri ? (
              <Image source={{ uri }} style={styles.fullScreenImage} resizeMode="contain" />
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => setFullScreen(false)}
            style={[styles.closeButton, { top: Math.max(insets.top, 12), right: 16 }]}
            accessibilityRole="button"
            accessibilityLabel="Cerrar foto"
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
    },
    hint: {
      fontSize: 12,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 14,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: 4,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.foreground,
    },
    actionSubtitle: {
      fontSize: 11,
    },
    previewCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    preview: {
      width: '100%',
      height: 160,
      backgroundColor: colors.secondary,
    },
    previewActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 10,
    },
    previewAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    previewActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    removeText: {
      color: colors.destructive,
    },
    fullScreen: {
      flex: 1,
      backgroundColor: '#000000',
    },
    fullScreenImageWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullScreenImage: {
      width: '100%',
      height: '100%',
    },
    closeButton: {
      position: 'absolute',
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
