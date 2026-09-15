import { Account } from '../constants/sampleData';
import { TablaHash } from './TablaHash';

const tablaCuentas = new TablaHash<string, Account>(8);

export const cuentasIndice = {
  reconstruir(cuentas: Account[]): void {
    tablaCuentas.vaciar();
    for (const cuenta of cuentas) {
      tablaCuentas.set(cuenta.id, cuenta);
    }
  },

  establecer(cuenta: Account): void {
    tablaCuentas.set(cuenta.id, cuenta);
  },

  obtener(id: string): Account | undefined {
    return tablaCuentas.get(id);
  },

  eliminar(id: string): Account | undefined {
    return tablaCuentas.remove(id);
  },

  valores(): Account[] {
    return tablaCuentas.valores();
  },

  vaciar(): void {
    tablaCuentas.vaciar();
  },

  get tamaño(): number {
    return tablaCuentas.tamaño;
  },

  get cubetas(): number {
    return tablaCuentas.cantidadCubetas;
  },

  get colisiones(): number {
    return tablaCuentas.cubetasConColision();
  },

  cubetaDe(id: string): number {
    return tablaCuentas.indiceCubeta(id);
  },
};
