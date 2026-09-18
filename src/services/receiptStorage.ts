import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { MovementItem } from '../constants/sampleData';

const STORAGE_KEY = '@receipt_uris';

function getReceiptsDir(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error('Almacenamiento local no disponible.');
  }

  return `${FileSystem.documentDirectory}comprobantes/`;
}

async function getReceiptMap(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function setReceiptMap(map: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

async function ensureReceiptsDir(): Promise<string> {
  const dir = getReceiptsDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

function extensionFromUri(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext && ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext)) {
    return ext;
  }
  return 'jpg';
}

export async function getReceiptUri(movementId: string): Promise<string | null> {
  const map = await getReceiptMap();
  const uri = map[movementId];
  if (!uri) {
    return null;
  }

  const info = await FileSystem.getInfoAsync(uri);
  return info.exists ? uri : null;
}

export async function saveReceiptLocally(
  movementId: string,
  sourceUri: string
): Promise<string> {
  const dir = await ensureReceiptsDir();
  const dest = `${dir}${movementId}.${extensionFromUri(sourceUri)}`;

  if (sourceUri !== dest) {
    const existing = await FileSystem.getInfoAsync(dest);
    if (existing.exists) {
      await FileSystem.deleteAsync(dest, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
  }

  const map = await getReceiptMap();
  map[movementId] = dest;
  await setReceiptMap(map);

  return dest;
}

export async function deleteReceiptLocally(movementId: string): Promise<void> {
  const map = await getReceiptMap();
  const uri = map[movementId];
  if (!uri) {
    return;
  }

  await FileSystem.deleteAsync(uri, { idempotent: true });
  delete map[movementId];
  await setReceiptMap(map);
}

export async function attachReceiptsToMovements(
  movements: MovementItem[]
): Promise<MovementItem[]> {
  const map = await getReceiptMap();
  return movements.map((movement) => {
    const receiptUri = map[movement.id];
    return receiptUri ? { ...movement, receiptUri } : movement;
  });
}
