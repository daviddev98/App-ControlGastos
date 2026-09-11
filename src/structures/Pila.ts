class NodoPila<T> {
  valor: T;
  siguiente: NodoPila<T> | null;

  constructor(valor: T) {
    this.valor = valor;
    this.siguiente = null;
  }
}

export class Pila<T> {
  private tope: NodoPila<T> | null = null;
  private _tamaño = 0;

  get tamaño(): number {
    return this._tamaño;
  }

  get estaVacia(): boolean {
    return this.tope === null;
  }

  apilar(valor: T): void {
    const nodo = new NodoPila(valor);
    nodo.siguiente = this.tope;
    this.tope = nodo;
    this._tamaño += 1;
  }

  desapilar(): T | undefined {
    if (!this.tope) {
      return undefined;
    }

    const valor = this.tope.valor;
    this.tope = this.tope.siguiente;
    this._tamaño -= 1;
    return valor;
  }

  cima(): T | undefined {
    return this.tope?.valor;
  }

  vaciar(): void {
    this.tope = null;
    this._tamaño = 0;
  }
}
