import { RootState } from '../index';

export const selectInicioActiveTab = (state: RootState) => state.ui.inicioActiveTab;

export const selectInicioSelectedMonthKey = (state: RootState) =>
  state.ui.inicioSelectedMonthKey;
