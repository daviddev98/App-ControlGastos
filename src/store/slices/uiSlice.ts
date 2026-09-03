import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getMonthKey } from '../../utils/date';

export type UiState = {
  inicioActiveTab: string;
  inicioSelectedMonthKey: string;
};

const initialState: UiState = {
  inicioActiveTab: 'movimientos',
  inicioSelectedMonthKey: getMonthKey(new Date()),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setInicioActiveTab: (state, action: PayloadAction<string>) => {
      state.inicioActiveTab = action.payload;
    },
    setInicioSelectedMonthKey: (state, action: PayloadAction<string>) => {
      state.inicioSelectedMonthKey = action.payload;
    },
  },
});

export const { setInicioActiveTab, setInicioSelectedMonthKey } = uiSlice.actions;
export default uiSlice.reducer;
