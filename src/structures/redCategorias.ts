import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/sampleData';
import { Grafo } from './Grafo';

const RELACIONES_CATEGORIAS: Array<[string, string]> = [
  ['Supermercado', 'Salud'],
  ['Supermercado', 'Otros'],
  ['Transporte', 'Servicios'],
  ['Transporte', 'Entretenimiento'],
  ['Electrónicos', 'Fotografía'],
  ['Electrónicos', 'Entretenimiento'],
  ['Fotografía', 'Entretenimiento'],
  ['Servicios', 'Salud'],
  ['Salud', 'Otros'],
  ['Entretenimiento', 'Otros'],
  ['Salario', 'Freelance'],
  ['Freelance', 'Inversiones'],
  ['Inversiones', 'Otros'],
  ['Regalo', 'Otros'],
  ['Salario', 'Servicios'],
];

const grafoCategorias = new Grafo();

function cargarRed(): void {
  grafoCategorias.vaciar();

  for (const categoria of EXPENSE_CATEGORIES) {
    grafoCategorias.agregarVertice(categoria);
  }

  for (const categoria of INCOME_CATEGORIES) {
    grafoCategorias.agregarVertice(categoria);
  }

  for (const [origen, destino] of RELACIONES_CATEGORIAS) {
    grafoCategorias.agregarArista(origen, destino);
  }
}

cargarRed();

export const CATEGORIAS_GRAFO = [
  ...EXPENSE_CATEGORIES.filter((categoria) => categoria !== 'Otros'),
  ...INCOME_CATEGORIES,
] as const;

export const redCategorias = {
  reconstruir(): void {
    cargarRed();
  },

  vertices(): string[] {
    return grafoCategorias.vertices();
  },

  vecinos(categoria: string): string[] {
    return grafoCategorias.vecinos(categoria);
  },

  bfs(inicio: string): string[] {
    return grafoCategorias.bfs(inicio);
  },

  dfs(inicio: string): string[] {
    return grafoCategorias.dfs(inicio);
  },

  vaciar(): void {
    grafoCategorias.vaciar();
  },
};
