import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '../index';
import { MovementItem } from '../../constants/sampleData';
import { movimientosLista } from '../../structures/movimientosLista';
import { cuentasIndice } from '../../structures/cuentasIndice';

const EMPTY_MOVIMIENTOS: MovementItem[] = [];

export const selectFinance = (state: RootState) => state.finance;

export const selectMovimientosByMonth = (state: RootState, monthKey: string) =>
  state.finance?.movimientosByMonth?.[monthKey] ?? EMPTY_MOVIMIENTOS;

export const selectMovimientosByAccount = (state: RootState, accountId: string) =>
  state.finance?.movimientosByAccount?.[accountId] ?? EMPTY_MOVIMIENTOS;

export const selectMovimientoById = (_state: RootState, movimientoId: string) =>
  movimientoId ? movimientosLista.buscar(movimientoId) : undefined;

export const selectPagosEnCola = createSelector(
  selectFinance,
  (finance) => finance.pagosEnCola
);

export const selectSiguientePagoId = createSelector(
  selectFinance,
  (finance) => finance.siguientePagoId
);

export const selectMetas = createSelector(selectFinance, (finance) => finance.metas);

export const selectSavingsMetas = createSelector(
  selectFinance,
  (finance) => finance.savingsMetas
);

export const selectSavingsMetaById = (state: RootState, metaId: string) =>
  metaId ? state.finance.savingsMetas.find((meta) => meta.id === metaId) : undefined;

export const selectCardWallet = createSelector(selectFinance, (finance) => finance.cardWallet);

export const selectAccounts = createSelector(selectFinance, (finance) => finance.accounts);

export const selectAccountById = (_state: RootState, accountId: string) =>
  cuentasIndice.obtener(accountId);

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

export const selectHashCuentasResumen = createSelector(selectFinance, (finance) => ({
  tamaño: finance.hashCuentasTamaño,
  cubetas: finance.hashCuentasCubetas,
  colisiones: finance.hashCuentasColisiones,
}));

export const selectMetaBuscadaId = createSelector(
  selectFinance,
  (finance) => finance.metaBuscadaId
);
