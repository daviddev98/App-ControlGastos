import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '../index';
import { buildMonthStatistics } from '../../utils/statistics';
import { movimientosLista } from '../../structures/movimientosLista';

export const selectFinance = (state: RootState) => state.finance;

export const selectMovimientosByMonth = (monthKey: string) =>
  createSelector(selectFinance, (finance) => finance.movimientosByMonth[monthKey] ?? []);

export const selectMovimientosByAccount = (accountId: string) =>
  createSelector(selectFinance, (finance) => finance.movimientosByAccount[accountId] ?? []);

export const selectMovimientoById = (movimientoId: string) =>
  createSelector(selectFinance, () => movimientosLista.buscar(movimientoId));

export const selectPagosEnCola = createSelector(
  selectFinance,
  (finance) => finance.pagosEnCola
);

export const selectSiguientePagoId = createSelector(
  selectFinance,
  (finance) => finance.siguientePagoId
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

export const selectPuedeDeshacer = createSelector(
  selectFinance,
  (finance) => finance.puedeDeshacer
);

export const selectPuedeRehacer = createSelector(
  selectFinance,
  (finance) => finance.puedeRehacer
);

export const selectEtiquetaDeshacer = createSelector(
  selectFinance,
  (finance) => finance.etiquetaDeshacer
);

export const selectEtiquetaRehacer = createSelector(
  selectFinance,
  (finance) => finance.etiquetaRehacer
);

export const selectRankingInorden = createSelector(
  selectFinance,
  (finance) => finance.rankingInorden
);

export const selectRankingPreorden = createSelector(
  selectFinance,
  (finance) => finance.rankingPreorden
);

export const selectRankingPostorden = createSelector(
  selectFinance,
  (finance) => finance.rankingPostorden
);

export const selectMetaBuscadaId = createSelector(
  selectFinance,
  (finance) => finance.metaBuscadaId
);
