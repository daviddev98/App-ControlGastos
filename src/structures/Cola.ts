class NodoCola<T> {
  valor: T;
  siguiente: NodoCola<T> | null;

  constructor(valor: T) {
    this.valor = valor;
    this.siguiente = null;
  }
}

export class Cola<T> {
  private frenteNodo: NodoCola<T> | null = null;
  private finalNodo: NodoCola<T> | null = null;
  private _tamaño = 0;

  get tamaño(): number {
    return this._tamaño;
  }

  get estaVacia(): boolean {
    return this.frenteNodo === null;
  }

  encolar(valor: T): void {
    const nodo = new NodoCola(valor);

    if (!this.frenteNodo || !this.finalNodo) {
      this.frenteNodo = nodo;
      this.finalNodo = nodo;
      this._tamaño += 1;
      return;
    }

    this.finalNodo.siguiente = nodo;
    this.finalNodo = nodo;
    this._tamaño += 1;
  }

  desencolar(): T | undefined {
    if (!this.frenteNodo) {
      return undefined;
    }

    const valor = this.frenteNodo.valor;
    this.frenteNodo = this.frenteNodo.siguiente;

    if (!this.frenteNodo) {
      this.finalNodo = null;
    }

    this._tamaño -= 1;
    return valor;
  }

  frente(): T | undefined {
    return this.frenteNodo?.valor;
  }

  recorrer(): T[] {
    const valores: T[] = [];
    let actual = this.frenteNodo;

    while (actual) {
      valores.push(actual.valor);
      actual = actual.siguiente;
    }

    return valores;
  }

  vaciar(): void {
    this.frenteNodo = null;
    this.finalNodo = null;
    this._tamaño = 0;
  }
}
