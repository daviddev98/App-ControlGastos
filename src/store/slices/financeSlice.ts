import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { getMonthDateRange, getMonthKeyFromDateString } from '../../utils/date';
import { mapMovementFromDb } from '../../utils/movimientos';

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

export const addMovimientoThunk = createAsyncThunk(
  'finance/addMovimiento',
  async (movementData: CreateMovementPayload, { rejectWithValue }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error('Usuario no autenticado.');

      const { data, error } = await supabase
        .from('movimientos')
        .insert([
          {
            user_id: userData.user.id,
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

      return mapMovementFromDb(data);
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
        .eq('user_id', userData.user.id)
        .select()
        .single();

      if (error) throw error;

      return mapMovementFromDb(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al actualizar el movimiento.');
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

      const movimientos = (data ?? []).map((item) => mapMovementFromDb(item));

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

      const movimientos = (data ?? []).map((item) => mapMovementFromDb(item));

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
};

function removeMovementFromCaches(state: FinanceState, movimientoId: string) {
  for (const key of Object.keys(state.movimientosByMonth)) {
    state.movimientosByMonth[key] = state.movimientosByMonth[key].filter(
      (movement) => movement.id !== movimientoId
    );
  }

  for (const key of Object.keys(state.movimientosByAccount)) {
    state.movimientosByAccount[key] = state.movimientosByAccount[key].filter(
      (movement) => movement.id !== movimientoId
    );
  }
}

function addMovementToCaches(state: FinanceState, movement: MovementItem) {
  const monthKey = movement.date ? getMonthKeyFromDateString(movement.date) : '2026-06';
  const monthItems = state.movimientosByMonth[monthKey] ?? [];
  state.movimientosByMonth[monthKey] = [
    movement,
    ...monthItems.filter((item) => item.id !== movement.id),
  ];

  const account = state.accounts.find((item) => item.name === movement.bankAccount);
  if (account) {
    const accountItems = state.movimientosByAccount[account.id] ?? [];
    state.movimientosByAccount[account.id] = [
      movement,
      ...accountItems.filter((item) => item.id !== movement.id),
    ];
  }
}

const initialState: FinanceState = {
  movimientosByMonth: {},
  movimientosByAccount: {},
  movimientosFetchRequestIdByMonth: {},
  metas: metasGoals,
  savingsMetas: [],
  cardWallet: cardWalletData,
  accounts: [],
};

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    addMovimiento: (state, action: PayloadAction<MovementItem>) => {
      addMovementToCaches(state, action.payload);
    },
    addAccount: (state, action: PayloadAction<Account>) => {
      state.accounts.push(action.payload);
    },
    addSavingsMeta: (state, action: PayloadAction<SavingsMeta>) => {
      state.savingsMetas.unshift(action.payload);
    },
    updateSavingsMeta: (state, action: PayloadAction<SavingsMeta>) => {
      const index = state.savingsMetas.findIndex((meta) => meta.id === action.payload.id);
      if (index !== -1) {
        state.savingsMetas[index] = action.payload;
      }
    },
  },
 
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountsThunk.fulfilled, (state, action) => {
        state.accounts = action.payload;
      })
      .addCase(fetchSavingsMetasThunk.fulfilled, (state, action) => {
        state.savingsMetas = action.payload;
      })
      .addCase(createNewAccountThunk.fulfilled, (state, action) => {
        const exists = state.accounts.some((account) => account.id === action.payload.id);
        if (!exists) {
          state.accounts.push(action.payload);
        }
      })
      .addCase(addMovimientoThunk.fulfilled, (state, action) => {
        addMovementToCaches(state, action.payload);
      })
      .addCase(updateMovimientoThunk.fulfilled, (state, action) => {
        removeMovementFromCaches(state, action.payload.id);
        addMovementToCaches(state, action.payload);
      })
      .addCase(addSavingsMetaThunk.fulfilled, (state, action) => {
        state.savingsMetas.unshift(action.payload);
      })
      .addCase(updateSavingsMetaThunk.fulfilled, (state, action) => {
        const index = state.savingsMetas.findIndex((meta) => meta.id === action.payload.id);
        if (index !== -1) {
          state.savingsMetas[index] = action.payload;
        }
      })
      .addCase(fetchMovimientosByMonthThunk.pending, (state, action) => {
        state.movimientosFetchRequestIdByMonth[action.meta.arg] = action.meta.requestId;
      })
      .addCase(fetchMovimientosByMonthThunk.fulfilled, (state, action) => {
        const { monthKey, movimientos } = action.payload;
        if (state.movimientosFetchRequestIdByMonth[monthKey] !== action.meta.requestId) {
          return;
        }
        state.movimientosByMonth[monthKey] = movimientos;
      })
      .addCase(fetchMovimientosByAccountThunk.fulfilled, (state, action) => {
        const { accountId, movimientos } = action.payload;
        state.movimientosByAccount[accountId] = movimientos;
      });
  },
});

export const { addMovimiento, addAccount, addSavingsMeta, updateSavingsMeta } =
  financeSlice.actions;
export default financeSlice.reducer;
