import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getMonthKey } from '../../utils/date';

export type UiState = {
  inicioActiveTab: string;
  inicioSelectedMonthKey: string;
  historialPanelToken: number | null;
};

const initialState: UiState = {
  inicioActiveTab: 'movimientos',
  inicioSelectedMonthKey: getMonthKey(new Date()),
  historialPanelToken: null,
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
    mostrarPanelHistorial: (state) => {
      state.historialPanelToken = Date.now();
    },
    ocultarPanelHistorial: (state) => {
      state.historialPanelToken = null;
    },
  },
});

export const {
  setInicioActiveTab,
  setInicioSelectedMonthKey,
  mostrarPanelHistorial,
  ocultarPanelHistorial,
} = uiSlice.actions;
export default uiSlice.reducer;
