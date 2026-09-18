import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { getMonthDateRange } from '../../utils/date';
import { attachReceiptsToMovements } from '../../services/receiptStorage';
import { mapMovementFromDb, mapMovementToDb } from '../../utils/movimientos';
import {
  construirSnapshotMovimientos,
  movimientosLista,
} from '../../structures/movimientosLista';
import { AccionMovimiento, historialMovimientos } from '../../structures/historialMovimientos';
import { colaPagos } from '../../structures/colaPagos';
import { rankingMetas } from '../../structures/rankingMetas';
import { cuentasIndice } from '../../structures/cuentasIndice';
import { getScheduledPayments } from '../../utils/statistics';

import {
  Account,
  CardWalletData,
  GoalItem,
  MovementItem,
  SavingsMeta,
  cardWalletData,
  metasGoals,
} from '../../constants/sampleData';

interface CreateAccountPayload {
  name: string;
  subtitle: string;
  type: Account['type'];
  balance: number;
  color: string;
  brand?: string;
}

function mapAccountTypeToDb(type: Account['type']): string {
  if (type === 'bank') {
    return 'savings';
  }
  return type;
}

function mapAccountFromDb(row: Record<string, unknown>): Account {
  const rawType = String(row.type ?? 'bank');
  const type: Account['type'] =
    rawType === 'savings' ? 'bank' : (rawType as Account['type']);

  return {
    id: String(row.id),
    name: String(row.name),
    subtitle: String(row.subtitle),
    type,
    balance: Number(row.balance),
    color: String(row.color),
    ...(row.brand ? { brand: row.brand as Account['brand'] } : {}),
  };
}

export const fetchAccountsThunk = createAsyncThunk(
  'finance/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');

      const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => mapAccountFromDb(row));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al consultar las cuentas.');
    }
  }
);

interface CreateMovementPayload {
  merchant: string;
  category: string;
  bankAccount: string;
  amount: number;
  dueDate: number;
  date: string;
}

interface UpdateMovementPayload extends CreateMovementPayload {
  id: string;
}

export const createNewAccountThunk = createAsyncThunk(
  'finance/createNewAccount',
  async (accountData: CreateAccountPayload, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');

      const { data, error } = await supabase
        .from('cuentas')
        .insert([
          {
            user_id: userData.user.id,
            name: accountData.name,
            subtitle: accountData.subtitle,
            type: mapAccountTypeToDb(accountData.type),
            balance: accountData.balance,
            color: accountData.color,
            brand: accountData.brand || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return mapAccountFromDb(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al crear la cuenta.');
    }
  }
);

export const deleteAccountThunk = createAsyncThunk(
  'finance/deleteAccount',
  async (
    { accountId, accountName }: { accountId: string; accountName: string },
    { rejectWithValue }
  ) => {
    try {
      const userId = await obtenerUsuarioId();

      const { error: movementsError } = await supabase
        .from('movimientos')
        .delete()
        .eq('user_id', userId)
        .eq('bank_account', accountName);

      if (movementsError) throw movementsError;

      const { error: accountError } = await supabase
        .from('cuentas')
        .delete()
        .eq('id', accountId)
        .eq('user_id', userId);

      if (accountError) throw accountError;

      return { accountId, accountName };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al eliminar la cuenta.');
    }
  }
);

export function calculateAccountBalanceDelta(
  accountType: Account['type'],
  amount: number
): number {
  if (accountType === 'credit_card') {
    // For credit cards, balance is debt/used credit.
    // An expense (amount < 0) increases used credit/debt.
    // An income/payment (amount > 0) decreases used credit/debt.
    return -amount;
  }
  // For bank and cash, balance is available funds.
  // An expense (amount < 0) decreases available balance.
  // An income (amount > 0) increases available balance.
  return amount;
}

async function aplicarAjusteSaldoEnDb(
  userId: string,
  bankAccountName: string,
  amountChange: number
): Promise<Account | null> {
  if (!bankAccountName || !bankAccountName.trim() || amountChange === 0) {
    return null;
  }

  const trimmedName = bankAccountName.trim();

  const { data: accounts, error: findError } = await supabase
    .from('cuentas')
    .select('*')
    .eq('user_id', userId);

  if (findError || !accounts || accounts.length === 0) {
    return null;
  }

  const matchingRow = accounts.find(
    (row) => String(row.name).trim().toLowerCase() === trimmedName.toLowerCase()
  );

  if (!matchingRow) {
    return null;
  }

  const acc = mapAccountFromDb(matchingRow);
  const delta = calculateAccountBalanceDelta(acc.type, amountChange);
  const newBalance = Number((acc.balance + delta).toFixed(2));

  const { data: updatedAccData, error: updateError } = await supabase
    .from('cuentas')
    .update({ balance: newBalance })
    .eq('id', acc.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError || !updatedAccData) {
    return null;
  }

  return mapAccountFromDb(updatedAccData);
}

export const addMovimientoThunk = createAsyncThunk(
  'finance/addMovimiento',
  async (movementData: CreateMovementPayload, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');
      const userId = userData.user.id;

      const { data, error } = await supabase
        .from('movimientos')
        .insert([
          {
            user_id: userId,
            merchant: movementData.merchant,
            category: movementData.category,
            bank_account: movementData.bankAccount,
            amount: movementData.amount,
            due_date: movementData.dueDate,
            date: movementData.date,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const createdMovement = mapMovementFromDb(data);

      const updatedAccount = await aplicarAjusteSaldoEnDb(
        userId,
        movementData.bankAccount,
        movementData.amount
      );

      return {
        ...createdMovement,
        _updatedAccounts: updatedAccount ? [updatedAccount] : [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al guardar el movimiento.');
    }
  }
);

export const updateMovimientoThunk = createAsyncThunk(
  'finance/updateMovimiento',
  async (movementData: UpdateMovementPayload, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');
      const userId = userData.user.id;

      const { data: prevData } = await supabase
        .from('movimientos')
        .select('*')
        .eq('id', movementData.id)
        .eq('user_id', userId)
        .maybeSingle();

      const prevMovement = prevData
        ? mapMovementFromDb(prevData)
        : movimientosLista.buscar(movementData.id);

      const { data, error } = await supabase
        .from('movimientos')
        .update({
          merchant: movementData.merchant,
          category: movementData.category,
          bank_account: movementData.bankAccount,
          amount: movementData.amount,
          due_date: movementData.dueDate,
          date: movementData.date,
        })
        .eq('id', movementData.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      const updatedMovement = mapMovementFromDb(data);
      const updatedAccounts: Account[] = [];

      if (prevMovement) {
        if (
          prevMovement.bankAccount.trim().toLowerCase() ===
          movementData.bankAccount.trim().toLowerCase()
        ) {
          const diffAmount = movementData.amount - prevMovement.amount;
          if (diffAmount !== 0) {
            const acc = await aplicarAjusteSaldoEnDb(
              userId,
              movementData.bankAccount,
              diffAmount
            );
            if (acc) updatedAccounts.push(acc);
          }
        } else {
          const oldAcc = await aplicarAjusteSaldoEnDb(
            userId,
            prevMovement.bankAccount,
            -prevMovement.amount
          );
          if (oldAcc) updatedAccounts.push(oldAcc);

          const newAcc = await aplicarAjusteSaldoEnDb(
            userId,
            movementData.bankAccount,
            movementData.amount
          );
          if (newAcc) updatedAccounts.push(newAcc);
        }
      }

      return {
        ...updatedMovement,
        _updatedAccounts: updatedAccounts,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al actualizar el movimiento.');
    }
  }
);

export const deleteMovimientoThunk = createAsyncThunk(
  'finance/deleteMovimiento',
  async (movimientoId: string, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');
      const userId = userData.user.id;

      const { data: prevData } = await supabase
        .from('movimientos')
        .select('*')
        .eq('id', movimientoId)
        .eq('user_id', userId)
        .maybeSingle();

      const prevMovement = prevData
        ? mapMovementFromDb(prevData)
        : movimientosLista.buscar(movimientoId);

      const { error } = await supabase
        .from('movimientos')
        .delete()
        .eq('id', movimientoId)
        .eq('user_id', userId);

      if (error) throw error;

      const updatedAccounts: Account[] = [];
      if (prevMovement) {
        const acc = await aplicarAjusteSaldoEnDb(
          userId,
          prevMovement.bankAccount,
          -prevMovement.amount
        );
        if (acc) updatedAccounts.push(acc);
      }

      return {
        id: movimientoId,
        _updatedAccounts: updatedAccounts,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al eliminar el movimiento.');
    }
  }
);

async function obtenerUsuarioId(): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Usuario no autenticado.');
  }

  return userData.user.id;
}

async function persistirCreacion(movimiento: MovementItem): Promise<void> {
  const userId = await obtenerUsuarioId();
  const { error } = await supabase.from('movimientos').insert([
    {
      id: movimiento.id,
      user_id: userId,
      ...mapMovementToDb(movimiento),
    },
  ]);

  if (error) {
    throw error;
  }
}

async function persistirActualizacion(movimiento: MovementItem): Promise<void> {
  const userId = await obtenerUsuarioId();
  const { error } = await supabase
    .from('movimientos')
    .update(mapMovementToDb(movimiento))
    .eq('id', movimiento.id)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

async function persistirEliminacion(movimientoId: string): Promise<void> {
  const userId = await obtenerUsuarioId();
  const { error } = await supabase
    .from('movimientos')
    .delete()
    .eq('id', movimientoId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

async function revertirAccionEnSupabase(accion: AccionMovimiento): Promise<void> {
  if (accion.tipo === 'crear') {
    await persistirEliminacion(accion.movimiento.id);
    return;
  }

  if (accion.tipo === 'editar') {
    await persistirActualizacion(accion.anterior);
    return;
  }

  await persistirCreacion(accion.movimiento);
}

async function reaplicarAccionEnSupabase(accion: AccionMovimiento): Promise<void> {
  if (accion.tipo === 'crear') {
    await persistirCreacion(accion.movimiento);
    return;
  }

  if (accion.tipo === 'editar') {
    await persistirActualizacion(accion.actual);
    return;
  }

  await persistirEliminacion(accion.movimiento.id);
}

function aplicarInversaEnLista(accion: AccionMovimiento): void {
  if (accion.tipo === 'crear') {
    movimientosLista.eliminar(accion.movimiento.id);
    return;
  }

  if (accion.tipo === 'editar') {
    movimientosLista.insertar(accion.anterior);
    return;
  }

  movimientosLista.insertar(accion.movimiento);
}

function aplicarDirectaEnLista(accion: AccionMovimiento): void {
  if (accion.tipo === 'crear') {
    movimientosLista.insertar(accion.movimiento);
    return;
  }

  if (accion.tipo === 'editar') {
    movimientosLista.insertar(accion.actual);
    return;
  }

  movimientosLista.eliminar(accion.movimiento.id);
}

export const deshacerMovimientoThunk = createAsyncThunk(
  'finance/deshacerMovimiento',
  async (_, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');
      const userId = userData.user.id;

      const accion = historialMovimientos.cimaDeshacer();
      if (!accion) {
        throw new Error('No hay acciones para deshacer.');
      }

      await revertirAccionEnSupabase(accion);

      const updatedAccounts: Account[] = [];
      if (accion.tipo === 'crear') {
        const acc = await aplicarAjusteSaldoEnDb(
          userId,
          accion.movimiento.bankAccount,
          -accion.movimiento.amount
        );
        if (acc) updatedAccounts.push(acc);
      } else if (accion.tipo === 'editar') {
        if (
          accion.anterior.bankAccount.trim().toLowerCase() ===
          accion.actual.bankAccount.trim().toLowerCase()
        ) {
          const diff = accion.anterior.amount - accion.actual.amount;
          const acc = await aplicarAjusteSaldoEnDb(
            userId,
            accion.anterior.bankAccount,
            diff
          );
          if (acc) updatedAccounts.push(acc);
        } else {
          const accActual = await aplicarAjusteSaldoEnDb(
            userId,
            accion.actual.bankAccount,
            -accion.actual.amount
          );
          if (accActual) updatedAccounts.push(accActual);
          const accAnterior = await aplicarAjusteSaldoEnDb(
            userId,
            accion.anterior.bankAccount,
            accion.anterior.amount
          );
          if (accAnterior) updatedAccounts.push(accAnterior);
        }
      } else if (accion.tipo === 'eliminar') {
        const acc = await aplicarAjusteSaldoEnDb(
          userId,
          accion.movimiento.bankAccount,
          accion.movimiento.amount
        );
        if (acc) updatedAccounts.push(acc);
      }

      return {
        accion,
        _updatedAccounts: updatedAccounts,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al deshacer la acción.');
    }
  }
);

export const rehacerMovimientoThunk = createAsyncThunk(
  'finance/rehacerMovimiento',
  async (_, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');
      const userId = userData.user.id;

      const accion = historialMovimientos.cimaRehacer();
      if (!accion) {
        throw new Error('No hay acciones para rehacer.');
      }

      await reaplicarAccionEnSupabase(accion);

      const updatedAccounts: Account[] = [];
      if (accion.tipo === 'crear') {
        const acc = await aplicarAjusteSaldoEnDb(
          userId,
          accion.movimiento.bankAccount,
          accion.movimiento.amount
        );
        if (acc) updatedAccounts.push(acc);
      } else if (accion.tipo === 'editar') {
        if (
          accion.anterior.bankAccount.trim().toLowerCase() ===
          accion.actual.bankAccount.trim().toLowerCase()
        ) {
          const diff = accion.actual.amount - accion.anterior.amount;
          const acc = await aplicarAjusteSaldoEnDb(
            userId,
            accion.actual.bankAccount,
            diff
          );
          if (acc) updatedAccounts.push(acc);
        } else {
          const accAnterior = await aplicarAjusteSaldoEnDb(
            userId,
            accion.anterior.bankAccount,
            -accion.anterior.amount
          );
          if (accAnterior) updatedAccounts.push(accAnterior);
          const accActual = await aplicarAjusteSaldoEnDb(
            userId,
            accion.actual.bankAccount,
            accion.actual.amount
          );
          if (accActual) updatedAccounts.push(accActual);
        }
      } else if (accion.tipo === 'eliminar') {
        const acc = await aplicarAjusteSaldoEnDb(
          userId,
          accion.movimiento.bankAccount,
          -accion.movimiento.amount
        );
        if (acc) updatedAccounts.push(acc);
      }

      return {
        accion,
        _updatedAccounts: updatedAccounts,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al rehacer la acción.');
    }
  }
);

function mapSavingsMetaFromDb(row: Record<string, unknown>): SavingsMeta {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    descripcion: String(row.descripcion ?? ''),
    categoria: row.categoria as SavingsMeta['categoria'],
    montoObjetivo: Number(row.monto_objetivo),
    montoActual: Number(row.monto_actual),
    fechaInicio: String(row.fecha_inicio),
    fechaLimite: String(row.fecha_limite),
    prioridad: row.prioridad as SavingsMeta['prioridad'],
    estado: row.estado as SavingsMeta['estado'],
    notas: String(row.notas ?? ''),
  };
}

export const fetchSavingsMetasThunk = createAsyncThunk(
  'finance/fetchSavingsMetas',
  async (_, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');

      const { data, error } = await supabase
        .from('ahorros_metas')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('fecha_limite', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => mapSavingsMetaFromDb(row));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al consultar las metas.');
    }
  }
);

export const addSavingsMetaThunk = createAsyncThunk(
  'finance/addSavingsMeta',
  async (metaData: Omit<SavingsMeta, 'id'>, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');

      const { data, error } = await supabase
        .from('ahorros_metas')
        .insert([
          {
            user_id: userData.user.id,
            nombre: metaData.nombre,
            descripcion: metaData.descripcion,
            categoria: metaData.categoria,
            monto_objetivo: metaData.montoObjetivo,
            monto_actual: metaData.montoActual,
            fecha_inicio: metaData.fechaInicio,
            fecha_limite: metaData.fechaLimite,
            prioridad: metaData.prioridad,
            estado: metaData.estado,
            notas: metaData.notas,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return mapSavingsMetaFromDb(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al crear la meta.');
    }
  }
);

export const updateSavingsMetaThunk = createAsyncThunk(
  'finance/updateSavingsMeta',
  async (metaData: SavingsMeta, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('ahorros_metas')
        .update({
          nombre: metaData.nombre,
          descripcion: metaData.descripcion,
          categoria: metaData.categoria,
          monto_objetivo: metaData.montoObjetivo,
          monto_actual: metaData.montoActual,
          fecha_inicio: metaData.fechaInicio,
          fecha_limite: metaData.fechaLimite,
          prioridad: metaData.prioridad,
          estado: metaData.estado,
          notas: metaData.notas,
        })
        .eq('id', metaData.id)
        .select()
        .single();

      if (error) throw error;

      return mapSavingsMetaFromDb(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al actualizar la meta.');
    }
  }
);

export const fetchMovimientosByMonthThunk = createAsyncThunk(
  'finance/fetchMovimientosByMonth',
  async (monthKey: string, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');

      const { startDate, endDate } = getMonthDateRange(monthKey);

      const { data, error } = await supabase
        .from('movimientos')
        .select('*')
        .eq('user_id', userData.user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      const movimientos = await attachReceiptsToMovements(
        (data ?? []).map((item) => mapMovementFromDb(item))
      );

      return { monthKey, movimientos };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al consultar movimientos del mes.');
    }
  }
);

export const fetchMovimientosByAccountThunk = createAsyncThunk(
  'finance/fetchMovimientosByAccount',
  async (
    { accountId, accountName }: { accountId: string; accountName: string },
    { rejectWithValue }
  ) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');

      const { data, error } = await supabase
        .from('movimientos')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('bank_account', accountName)
        .order('date', { ascending: false });

      if (error) throw error;

      const movimientos = await attachReceiptsToMovements(
        (data ?? []).map((item) => mapMovementFromDb(item))
      );

      return { accountId, movimientos };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al consultar movimientos de la cuenta.');
    }
  }
);


export type FinanceState = {
  movimientosByMonth: Record<string, MovementItem[]>;
  movimientosByAccount: Record<string, MovementItem[]>;
  movimientosFetchRequestIdByMonth: Record<string, string>;
  metas: GoalItem[];
  savingsMetas: SavingsMeta[];
  cardWallet: CardWalletData;
  accounts: Account[];
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  etiquetaDeshacer: string | null;
  etiquetaRehacer: string | null;
  pagosEnCola: MovementItem[];
  siguientePagoId: string | null;
  rankingInorden: SavingsMeta[];
  rankingPreorden: SavingsMeta[];
  rankingPostorden: SavingsMeta[];
  metaBuscadaId: string | null;
  hashCuentasTamaño: number;
  hashCuentasCubetas: number;
  hashCuentasColisiones: number;
};

function sincronizarMovimientosEnEstado(state: FinanceState) {
  const snapshot = construirSnapshotMovimientos(state.accounts);
  state.movimientosByMonth = snapshot.movimientosByMonth;
  state.movimientosByAccount = snapshot.movimientosByAccount;
  sincronizarColaEnEstado(state);
}

function sincronizarHistorialEnEstado(state: FinanceState) {
  state.puedeDeshacer = historialMovimientos.puedeDeshacer();
  state.puedeRehacer = historialMovimientos.puedeRehacer();
  state.etiquetaDeshacer = historialMovimientos.etiquetaCimaDeshacer();
  state.etiquetaRehacer = historialMovimientos.etiquetaCimaRehacer();
}

function sincronizarRankingEnEstado(state: FinanceState) {
  rankingMetas.reconstruir(state.savingsMetas);
  state.rankingInorden = rankingMetas.inorden();
  state.rankingPreorden = rankingMetas.preorden();
  state.rankingPostorden = rankingMetas.postorden();
}

function sincronizarCuentasEnEstado(state: FinanceState) {
  state.accounts = cuentasIndice.valores();
  state.hashCuentasTamaño = cuentasIndice.tamaño;
  state.hashCuentasCubetas = cuentasIndice.cubetas;
  state.hashCuentasColisiones = cuentasIndice.colisiones;
}

function aplicarSnapshotCola(state: FinanceState) {
  state.pagosEnCola = colaPagos.recorrer();
  state.siguientePagoId = colaPagos.frente()?.id ?? null;
}

function sincronizarColaEnEstado(state: FinanceState, monthKey = colaPagos.mesActual) {
  if (!monthKey) {
    aplicarSnapshotCola(state);
    return;
  }

  colaPagos.reconstruir(monthKey, getScheduledPayments(state.movimientosByMonth[monthKey] ?? []));
  aplicarSnapshotCola(state);
}

const initialState: FinanceState = {
  movimientosByMonth: {},
  movimientosByAccount: {},
  movimientosFetchRequestIdByMonth: {},
  metas: metasGoals,
  savingsMetas: [],
  cardWallet: cardWalletData,
  accounts: [],
  puedeDeshacer: false,
  puedeRehacer: false,
  etiquetaDeshacer: null,
  etiquetaRehacer: null,
  pagosEnCola: [],
  siguientePagoId: null,
  rankingInorden: [],
  rankingPreorden: [],
  rankingPostorden: [],
  metaBuscadaId: null,
  hashCuentasTamaño: 0,
  hashCuentasCubetas: 8,
  hashCuentasColisiones: 0,
};

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    addMovimiento: (state, action: PayloadAction<MovementItem>) => {
      movimientosLista.insertar(action.payload);
      const accounts = cuentasIndice.valores();
      const matchingAccount = accounts.find(
        (acc) => acc.name.trim().toLowerCase() === action.payload.bankAccount.trim().toLowerCase()
      );
      if (matchingAccount) {
        const delta = calculateAccountBalanceDelta(matchingAccount.type, action.payload.amount);
        const updatedAcc: Account = {
          ...matchingAccount,
          balance: Number((matchingAccount.balance + delta).toFixed(2)),
        };
        cuentasIndice.establecer(updatedAcc);
        sincronizarCuentasEnEstado(state);
      }
      sincronizarMovimientosEnEstado(state);
    },
    addAccount: (state, action: PayloadAction<Account>) => {
      cuentasIndice.establecer(action.payload);
      sincronizarCuentasEnEstado(state);
      sincronizarMovimientosEnEstado(state);
    },
    addSavingsMeta: (state, action: PayloadAction<SavingsMeta>) => {
      state.savingsMetas.unshift(action.payload);
      sincronizarRankingEnEstado(state);
    },
    updateSavingsMeta: (state, action: PayloadAction<SavingsMeta>) => {
      const index = state.savingsMetas.findIndex((meta) => meta.id === action.payload.id);
      if (index !== -1) {
        state.savingsMetas[index] = action.payload;
      }
      sincronizarRankingEnEstado(state);
    },
    setMetaBuscadaId: (state, action: PayloadAction<string | null>) => {
      state.metaBuscadaId = action.payload;
    },
    reconstruirColaPagos: (state, action: PayloadAction<string>) => {
      sincronizarColaEnEstado(state, action.payload);
    },
    atenderSiguientePago: (state) => {
      colaPagos.atenderSiguiente();
      aplicarSnapshotCola(state);
    },
    resetFinanceState: () => {
      movimientosLista.vaciar();
      historialMovimientos.vaciar();
      colaPagos.vaciar();
      rankingMetas.vaciar();
      cuentasIndice.vaciar();
      return {
        movimientosByMonth: {},
        movimientosByAccount: {},
        movimientosFetchRequestIdByMonth: {},
        metas: metasGoals,
        savingsMetas: [],
        cardWallet: cardWalletData,
        accounts: [],
        puedeDeshacer: false,
        puedeRehacer: false,
        etiquetaDeshacer: null,
        etiquetaRehacer: null,
        pagosEnCola: [],
        siguientePagoId: null,
        rankingInorden: [],
        rankingPreorden: [],
        rankingPostorden: [],
        metaBuscadaId: null,
        hashCuentasTamaño: 0,
        hashCuentasCubetas: 8,
        hashCuentasColisiones: 0,
      };
    },
  },
 
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountsThunk.fulfilled, (state, action) => {
        cuentasIndice.reconstruir(action.payload);
        sincronizarCuentasEnEstado(state);
        sincronizarMovimientosEnEstado(state);
      })
      .addCase(fetchSavingsMetasThunk.fulfilled, (state, action) => {
        state.savingsMetas = action.payload;
        sincronizarRankingEnEstado(state);
      })
      .addCase(createNewAccountThunk.fulfilled, (state, action) => {
        cuentasIndice.establecer(action.payload);
        sincronizarCuentasEnEstado(state);
        sincronizarMovimientosEnEstado(state);
      })
      .addCase(deleteAccountThunk.fulfilled, (state, action) => {
        movimientosLista.eliminarPorCuenta(action.payload.accountName);
        historialMovimientos.vaciar();
        cuentasIndice.eliminar(action.payload.accountId);
        sincronizarCuentasEnEstado(state);
        sincronizarMovimientosEnEstado(state);
        sincronizarHistorialEnEstado(state);
      })
      .addCase(addMovimientoThunk.fulfilled, (state, action) => {
        const { _updatedAccounts, ...movement } = action.payload;
        historialMovimientos.registrarCrear(movement as MovementItem);
        movimientosLista.insertar(movement as MovementItem);
        if (_updatedAccounts && _updatedAccounts.length > 0) {
          for (const acc of _updatedAccounts) {
            cuentasIndice.establecer(acc);
          }
          sincronizarCuentasEnEstado(state);
        }
        sincronizarMovimientosEnEstado(state);
        sincronizarHistorialEnEstado(state);
      })
      .addCase(updateMovimientoThunk.fulfilled, (state, action) => {
        const { _updatedAccounts, ...movement } = action.payload;
        const anterior = movimientosLista.buscar(movement.id);
        if (anterior) {
          historialMovimientos.registrarEditar(anterior, movement as MovementItem);
        }
        movimientosLista.insertar(movement as MovementItem);
        if (_updatedAccounts && _updatedAccounts.length > 0) {
          for (const acc of _updatedAccounts) {
            cuentasIndice.establecer(acc);
          }
          sincronizarCuentasEnEstado(state);
        }
        sincronizarMovimientosEnEstado(state);
        sincronizarHistorialEnEstado(state);
      })
      .addCase(deleteMovimientoThunk.fulfilled, (state, action) => {
        const { id: movimientoId, _updatedAccounts } = action.payload;
        const eliminado = movimientosLista.eliminar(movimientoId);
        if (eliminado) {
          historialMovimientos.registrarEliminar(eliminado);
        }
        if (_updatedAccounts && _updatedAccounts.length > 0) {
          for (const acc of _updatedAccounts) {
            cuentasIndice.establecer(acc);
          }
          sincronizarCuentasEnEstado(state);
        }
        sincronizarMovimientosEnEstado(state);
        sincronizarHistorialEnEstado(state);
      })
      .addCase(deshacerMovimientoThunk.fulfilled, (state, action) => {
        const { accion, _updatedAccounts } = action.payload;
        historialMovimientos.confirmarDeshacer();
        aplicarInversaEnLista(accion);
        if (_updatedAccounts && _updatedAccounts.length > 0) {
          for (const acc of _updatedAccounts) {
            cuentasIndice.establecer(acc);
          }
          sincronizarCuentasEnEstado(state);
        }
        sincronizarMovimientosEnEstado(state);
        sincronizarHistorialEnEstado(state);
      })
      .addCase(rehacerMovimientoThunk.fulfilled, (state, action) => {
        const { accion, _updatedAccounts } = action.payload;
        historialMovimientos.confirmarRehacer();
        aplicarDirectaEnLista(accion);
        if (_updatedAccounts && _updatedAccounts.length > 0) {
          for (const acc of _updatedAccounts) {
            cuentasIndice.establecer(acc);
          }
          sincronizarCuentasEnEstado(state);
        }
        sincronizarMovimientosEnEstado(state);
        sincronizarHistorialEnEstado(state);
      })
      .addCase(addSavingsMetaThunk.fulfilled, (state, action) => {
        state.savingsMetas.unshift(action.payload);
        sincronizarRankingEnEstado(state);
      })
      .addCase(updateSavingsMetaThunk.fulfilled, (state, action) => {
        const index = state.savingsMetas.findIndex((meta) => meta.id === action.payload.id);
        if (index !== -1) {
          state.savingsMetas[index] = action.payload;
        }
        sincronizarRankingEnEstado(state);
      })
      .addCase(fetchMovimientosByMonthThunk.pending, (state, action) => {
        state.movimientosFetchRequestIdByMonth[action.meta.arg] = action.meta.requestId;
      })
      .addCase(fetchMovimientosByMonthThunk.fulfilled, (state, action) => {
        const { monthKey, movimientos } = action.payload;
        if (state.movimientosFetchRequestIdByMonth[monthKey] !== action.meta.requestId) {
          return;
        }
        movimientosLista.reemplazarMes(monthKey, movimientos);
        sincronizarMovimientosEnEstado(state);
      })
      .addCase(fetchMovimientosByAccountThunk.fulfilled, (state, action) => {
        movimientosLista.fusionar(action.payload.movimientos);
        sincronizarMovimientosEnEstado(state);
      });
  },
});

export const {
  addMovimiento,
  addAccount,
  addSavingsMeta,
  updateSavingsMeta,
  setMetaBuscadaId,
  reconstruirColaPagos,
  atenderSiguientePago,
  resetFinanceState,
} = financeSlice.actions;
export default financeSlice.reducer;
