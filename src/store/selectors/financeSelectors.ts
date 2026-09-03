import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '../index';
import { buildMonthStatistics, getScheduledPayments } from '../../utils/statistics';
import { movimientosLista } from '../../structures/movimientosLista';

export const selectFinance = (state: RootState) => state.finance;

export const selectMovimientosByMonth = (monthKey: string) =>
  createSelector(selectFinance, (finance) => finance.movimientosByMonth[monthKey] ?? []);

export const selectMovimientosByAccount = (accountId: string) =>
  createSelector(selectFinance, (finance) => finance.movimientosByAccount[accountId] ?? []);

export const selectMovimientoById = (movimientoId: string) =>
  createSelector(selectFinance, () => movimientosLista.buscar(movimientoId));

export const selectPagosProgramadosByMonth = (monthKey: string) =>
  createSelector(selectMovimientosByMonth(monthKey), (movimientos) =>
    getScheduledPayments(movimientos)
  );

export const selectMonthStatistics = (monthKey: string) =>
  createSelector(selectMovimientosByMonth(monthKey), (movimientos) =>
    buildMonthStatistics(movimientos, monthKey)
  );

export const selectMetas = createSelector(selectFinance, (finance) => finance.metas);

export const selectSavingsMetas = createSelector(
  selectFinance,
  (finance) => finance.savingsMetas
);

export const selectSavingsMetaById = (metaId: string) =>
  createSelector(selectSavingsMetas, (metas) => metas.find((meta) => meta.id === metaId));

export const selectCardWallet = createSelector(selectFinance, (finance) => finance.cardWallet);

export const selectAccounts = createSelector(selectFinance, (finance) => finance.accounts);

export const selectAccountById = (accountId: string) =>
  createSelector(selectAccounts, (accounts) =>
    accounts.find((account) => account.id === accountId)
  );

export const selectAccountsNetBalance = createSelector(selectAccounts, (accounts) =>
  accounts.reduce((total, account) => {
    if (account.type === 'credit_card') {
      return total - account.balance;
    }
    return total + account.balance;
  }, 0)
);
