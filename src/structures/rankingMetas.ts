import { SavingsMeta } from '../constants/sampleData';
import { ArbolBinario } from './ArbolBinario';

export function compararMetas(a: SavingsMeta, b: SavingsMeta): number {
  if (a.montoObjetivo !== b.montoObjetivo) {
    return a.montoObjetivo - b.montoObjetivo;
  }
  return a.id.localeCompare(b.id);
}

const arbolRanking = new ArbolBinario<SavingsMeta>(compararMetas);

export const rankingMetas = {
  reconstruir(metas: SavingsMeta[]): void {
    arbolRanking.vaciar();
    for (const meta of metas) {
      arbolRanking.insertar(meta);
    }
  },

  insertar(meta: SavingsMeta): void {
    arbolRanking.insertar(meta);
  },

  buscarPorId(id: string): SavingsMeta | undefined {
    return arbolRanking.buscar((meta) => meta.id === id);
  },

  buscarPorMonto(monto: number): SavingsMeta | undefined {
    return arbolRanking.buscar((meta) => meta.montoObjetivo === monto);
  },

  buscar(predicado: (meta: SavingsMeta) => boolean): SavingsMeta | undefined {
    return arbolRanking.buscar(predicado);
  },

  inorden(): SavingsMeta[] {
    return arbolRanking.inorden();
  },

  preorden(): SavingsMeta[] {
    return arbolRanking.preorden();
  },

  postorden(): SavingsMeta[] {
    return arbolRanking.postorden();
  },

  vaciar(): void {
    arbolRanking.vaciar();
  },

  get tamaño(): number {
    return arbolRanking.tamaño;
  },

  get estaVacio(): boolean {
    return arbolRanking.estaVacio;
  },

  get estaVacia(): boolean {
    return arbolRanking.estaVacia;
  },

  get altura(): number {
    return arbolRanking.altura;
  },
};
