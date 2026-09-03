import { Account, MovementItem } from '../constants/sampleData';
import { getMonthKeyFromDateString } from '../utils/date';
import { ListaEnlazada } from './ListaEnlazada';

const listaMovimientos = new ListaEnlazada<MovementItem>();

function coincideMes(movimiento: MovementItem, monthKey: string): boolean {
  if (!movimiento.date) {
    return monthKey === 'sin-fecha';
  }

  return getMonthKeyFromDateString(movimiento.date) === monthKey;
}

export const movimientosLista = {
  insertar(movimiento: MovementItem): void {
    listaMovimientos.eliminar((item) => item.id === movimiento.id);
    listaMovimientos.insertar(movimiento);
  },

  eliminar(id: string): MovementItem | null {
    return listaMovimientos.eliminar((item) => item.id === id);
  },

  buscar(id: string): MovementItem | undefined {
    return listaMovimientos.buscar((item) => item.id === id);
  },

  recorrer(): MovementItem[] {
    return listaMovimientos.recorrer();
  },

  reemplazarMes(monthKey: string, movimientos: MovementItem[]): void {
    listaMovimientos.eliminarTodos((item) => coincideMes(item, monthKey));

    for (const movimiento of movimientos) {
      listaMovimientos.eliminar((item) => item.id === movimiento.id);
      listaMovimientos.insertarAlFinal(movimiento);
    }
  },

  fusionar(movimientos: MovementItem[]): void {
    for (const movimiento of movimientos) {
      listaMovimientos.eliminar((item) => item.id === movimiento.id);
      listaMovimientos.insertarAlFinal(movimiento);
    }
  },

  vaciar(): void {
    listaMovimientos.vaciar();
  },

  get tamaño(): number {
    return listaMovimientos.tamaño;
  },
};

export function construirSnapshotMovimientos(accounts: Account[]): {
  movimientosByMonth: Record<string, MovementItem[]>;
  movimientosByAccount: Record<string, MovementItem[]>;
} {
  const movimientosByMonth: Record<string, MovementItem[]> = {};
  const movimientosByAccount: Record<string, MovementItem[]> = {};
  const accountIdByName = new Map(accounts.map((account) => [account.name, account.id]));

  listaMovimientos.recorrer((movimiento) => {
    const monthKey = movimiento.date
      ? getMonthKeyFromDateString(movimiento.date)
      : 'sin-fecha';

    if (!movimientosByMonth[monthKey]) {
      movimientosByMonth[monthKey] = [];
    }
    movimientosByMonth[monthKey].push(movimiento);

    const accountId = accountIdByName.get(movimiento.bankAccount);
    if (!accountId) {
      return;
    }

    if (!movimientosByAccount[accountId]) {
      movimientosByAccount[accountId] = [];
    }
    movimientosByAccount[accountId].push(movimiento);
  });

  return { movimientosByMonth, movimientosByAccount };
}
