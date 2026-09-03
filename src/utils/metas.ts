import { SavingsMeta } from '../constants/sampleData';

export function getMetaProgress(meta: SavingsMeta): number {
  if (meta.montoObjetivo <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((meta.montoActual / meta.montoObjetivo) * 100));
}

export function getPriorityColor(prioridad: SavingsMeta['prioridad']): string {
  switch (prioridad) {
    case 'alta':
      return '#EF4444';
    case 'media':
      return '#F59E0B';
    case 'baja':
      return '#22C55E';
    default:
      return '#6B7280';
  }
}

export function getStatusColor(estado: SavingsMeta['estado']): string {
  switch (estado) {
    case 'activa':
      return '#3B82F6';
    case 'completada':
      return '#16A34A';
    case 'pausada':
      return '#9CA3AF';
    default:
      return '#6B7280';
  }
}
