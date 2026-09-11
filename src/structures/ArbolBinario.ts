export class NodoArbol<T> {
  valor: T;
  izquierdo: NodoArbol<T> | null;
  derecho: NodoArbol<T> | null;

  constructor(valor: T) {
    this.valor = valor;
    this.izquierdo = null;
    this.derecho = null;
  }
}

export class ArbolBinario<T> {
  private raiz: NodoArbol<T> | null = null;
  private _tamaño = 0;
  private comparador: (a: T, b: T) => number;

  constructor(comparador: (a: T, b: T) => number) {
    this.comparador = comparador;
  }

  get tamaño(): number {
    return this._tamaño;
  }

  get estaVacio(): boolean {
    return this.raiz === null;
  }

  get estaVacia(): boolean {
    return this.raiz === null;
  }

  get altura(): number {
    return this.calcularAltura(this.raiz);
  }

  insertar(valor: T): void {
    const nuevoNodo = new NodoArbol(valor);

    if (!this.raiz) {
      this.raiz = nuevoNodo;
      this._tamaño += 1;
      return;
    }

    let actual = this.raiz;

    while (true) {
      const comparacion = this.comparador(valor, actual.valor);

      if (comparacion < 0) {
        if (!actual.izquierdo) {
          actual.izquierdo = nuevoNodo;
          this._tamaño += 1;
          break;
        }
        actual = actual.izquierdo;
      } else {
        if (!actual.derecho) {
          actual.derecho = nuevoNodo;
          this._tamaño += 1;
          break;
        }
        actual = actual.derecho;
      }
    }
  }

  buscar(predicado: (valor: T) => boolean): T | undefined {
    return this.buscarEnSubarbol(this.raiz, predicado);
  }

  private buscarEnSubarbol(
    nodo: NodoArbol<T> | null,
    predicado: (valor: T) => boolean
  ): T | undefined {
    if (!nodo) {
      return undefined;
    }

    if (predicado(nodo.valor)) {
      return nodo.valor;
    }

    const encontradoIzquierdo = this.buscarEnSubarbol(nodo.izquierdo, predicado);
    if (encontradoIzquierdo !== undefined) {
      return encontradoIzquierdo;
    }

    return this.buscarEnSubarbol(nodo.derecho, predicado);
  }

  inorden(): T[] {
    const resultado: T[] = [];
    this.recorrerInorden(this.raiz, resultado);
    return resultado;
  }

  private recorrerInorden(nodo: NodoArbol<T> | null, resultado: T[]): void {
    if (!nodo) return;
    this.recorrerInorden(nodo.izquierdo, resultado);
    resultado.push(nodo.valor);
    this.recorrerInorden(nodo.derecho, resultado);
  }

  preorden(): T[] {
    const resultado: T[] = [];
    this.recorrerPreorden(this.raiz, resultado);
    return resultado;
  }

  private recorrerPreorden(nodo: NodoArbol<T> | null, resultado: T[]): void {
    if (!nodo) return;
    resultado.push(nodo.valor);
    this.recorrerPreorden(nodo.izquierdo, resultado);
    this.recorrerPreorden(nodo.derecho, resultado);
  }

  postorden(): T[] {
    const resultado: T[] = [];
    this.recorrerPostorden(this.raiz, resultado);
    return resultado;
  }

  private recorrerPostorden(nodo: NodoArbol<T> | null, resultado: T[]): void {
    if (!nodo) return;
    this.recorrerPostorden(nodo.izquierdo, resultado);
    this.recorrerPostorden(nodo.derecho, resultado);
    resultado.push(nodo.valor);
  }

  vaciar(): void {
    this.raiz = null;
    this._tamaño = 0;
  }

  private calcularAltura(nodo: NodoArbol<T> | null): number {
    if (!nodo) return 0;
    return 1 + Math.max(this.calcularAltura(nodo.izquierdo), this.calcularAltura(nodo.derecho));
  }
}
