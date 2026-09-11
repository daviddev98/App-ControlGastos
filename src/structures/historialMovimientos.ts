import { MovementItem } from '../constants/sampleData';
import { Pila } from './Pila';

const MAX_ACCIONES = 30;

export type AccionMovimiento =
  | { tipo: 'crear'; movimiento: MovementItem }
  | { tipo: 'editar'; anterior: MovementItem; actual: MovementItem }
  | { tipo: 'eliminar'; movimiento: MovementItem };

const pilaDeshacer = new Pila<AccionMovimiento>();
const pilaRehacer = new Pila<AccionMovimiento>();

function clonarMovimiento(movimiento: MovementItem): MovementItem {
  return { ...movimiento };
}

function clonarAccion(accion: AccionMovimiento): AccionMovimiento {
  if (accion.tipo === 'editar') {
    return {
      tipo: 'editar',
      anterior: clonarMovimiento(accion.anterior),
      actual: clonarMovimiento(accion.actual),
    };
  }

  return {
    tipo: accion.tipo,
    movimiento: clonarMovimiento(accion.movimiento),
  };
}

function recortarDeshacer(): void {
  if (pilaDeshacer.tamaño <= MAX_ACCIONES) {
    return;
  }

  const conservadas: AccionMovimiento[] = [];
  while (!pilaDeshacer.estaVacia) {
    const accion = pilaDeshacer.desapilar();
    if (accion) {
      conservadas.push(accion);
    }
  }

  conservadas.reverse();
  const recientes = conservadas.slice(-MAX_ACCIONES);
  for (const accion of recientes) {
    pilaDeshacer.apilar(accion);
  }
}

export function etiquetaAccion(accion: AccionMovimiento): string {
  if (accion.tipo === 'crear') {
    return `registro de ${accion.movimiento.merchant}`;
  }

  if (accion.tipo === 'editar') {
    return `edición de ${accion.actual.merchant}`;
  }

  return `eliminación de ${accion.movimiento.merchant}`;
}

export const historialMovimientos = {
  registrarCrear(movimiento: MovementItem): void {
    pilaDeshacer.apilar({ tipo: 'crear', movimiento: clonarMovimiento(movimiento) });
    pilaRehacer.vaciar();
    recortarDeshacer();
  },

  registrarEditar(anterior: MovementItem, actual: MovementItem): void {
    pilaDeshacer.apilar({
      tipo: 'editar',
      anterior: clonarMovimiento(anterior),
      actual: clonarMovimiento(actual),
    });
    pilaRehacer.vaciar();
    recortarDeshacer();
  },

  registrarEliminar(movimiento: MovementItem): void {
    pilaDeshacer.apilar({ tipo: 'eliminar', movimiento: clonarMovimiento(movimiento) });
    pilaRehacer.vaciar();
    recortarDeshacer();
  },

  cimaDeshacer(): AccionMovimiento | undefined {
    const accion = pilaDeshacer.cima();
    return accion ? clonarAccion(accion) : undefined;
  },

  cimaRehacer(): AccionMovimiento | undefined {
    const accion = pilaRehacer.cima();
    return accion ? clonarAccion(accion) : undefined;
  },

  confirmarDeshacer(): AccionMovimiento | undefined {
    const accion = pilaDeshacer.desapilar();
    if (!accion) {
      return undefined;
    }

    pilaRehacer.apilar(clonarAccion(accion));
    return accion;
  },

  confirmarRehacer(): AccionMovimiento | undefined {
    const accion = pilaRehacer.desapilar();
    if (!accion) {
      return undefined;
    }

    pilaDeshacer.apilar(clonarAccion(accion));
    return accion;
  },

  puedeDeshacer(): boolean {
    return !pilaDeshacer.estaVacia;
  },

  puedeRehacer(): boolean {
    return !pilaRehacer.estaVacia;
  },

  etiquetaCimaDeshacer(): string | null {
    const accion = pilaDeshacer.cima();
    return accion ? etiquetaAccion(accion) : null;
  },

  etiquetaCimaRehacer(): string | null {
    const accion = pilaRehacer.cima();
    return accion ? etiquetaAccion(accion) : null;
  },

  vaciar(): void {
    pilaDeshacer.vaciar();
    pilaRehacer.vaciar();
  },
};
