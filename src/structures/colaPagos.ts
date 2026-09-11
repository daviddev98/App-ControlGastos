import { MovementItem } from '../constants/sampleData';
import { Cola } from './Cola';

const colaPagosInterna = new Cola<MovementItem>();
const pagosAtendidos = new Set<string>();
let mesActual: string | null = null;

export const colaPagos = {
  reconstruir(monthKey: string, pagosOrdenados: MovementItem[]): void {
    if (mesActual !== monthKey) {
      pagosAtendidos.clear();
      mesActual = monthKey;
    }

    colaPagosInterna.vaciar();

    for (const pago of pagosOrdenados) {
      if (!pagosAtendidos.has(pago.id)) {
        colaPagosInterna.encolar(pago);
      }
    }
  },

  atenderSiguiente(): MovementItem | undefined {
    const pago = colaPagosInterna.desencolar();
    if (pago) {
      pagosAtendidos.add(pago.id);
    }
    return pago;
  },

  frente(): MovementItem | undefined {
    return colaPagosInterna.frente();
  },

  recorrer(): MovementItem[] {
    return colaPagosInterna.recorrer();
  },

  get tamaño(): number {
    return colaPagosInterna.tamaño;
  },

  get estaVacia(): boolean {
    return colaPagosInterna.estaVacia;
  },

  get mesActual(): string | null {
    return mesActual;
  },

  vaciar(): void {
    colaPagosInterna.vaciar();
    pagosAtendidos.clear();
    mesActual = null;
  },
};
