export class Nodo<T> {
  valor: T;
  siguiente: Nodo<T> | null;

  constructor(valor: T) {
    this.valor = valor;
    this.siguiente = null;
  }
}

export class ListaEnlazada<T> {
  private cabeza: Nodo<T> | null = null;
  private cola: Nodo<T> | null = null;
  private _tamaño = 0;

  get tamaño(): number {
    return this._tamaño;
  }

  get estaVacia(): boolean {
    return this.cabeza === null;
  }

  insertar(valor: T): void {
    this.insertarAlInicio(valor);
  }

  insertarAlInicio(valor: T): void {
    const nodo = new Nodo(valor);
    nodo.siguiente = this.cabeza;
    this.cabeza = nodo;

    if (!this.cola) {
      this.cola = nodo;
    }

    this._tamaño += 1;
  }

  insertarAlFinal(valor: T): void {
    const nodo = new Nodo(valor);

    if (!this.cabeza || !this.cola) {
      this.cabeza = nodo;
      this.cola = nodo;
      this._tamaño += 1;
      return;
    }

    this.cola.siguiente = nodo;
    this.cola = nodo;
    this._tamaño += 1;
  }

  eliminar(predicado: (valor: T) => boolean): T | null {
    if (!this.cabeza) {
      return null;
    }

    if (predicado(this.cabeza.valor)) {
      const valorEliminado = this.cabeza.valor;
      this.cabeza = this.cabeza.siguiente;

      if (!this.cabeza) {
        this.cola = null;
      }

      this._tamaño -= 1;
      return valorEliminado;
    }

    let anterior = this.cabeza;
    let actual = this.cabeza.siguiente;

    while (actual) {
      if (predicado(actual.valor)) {
        anterior.siguiente = actual.siguiente;

        if (actual === this.cola) {
          this.cola = anterior;
        }

        this._tamaño -= 1;
        return actual.valor;
      }

      anterior = actual;
      actual = actual.siguiente;
    }

    return null;
  }

  eliminarTodos(predicado: (valor: T) => boolean): number {
    let eliminados = 0;

    while (this.cabeza && predicado(this.cabeza.valor)) {
      this.cabeza = this.cabeza.siguiente;
      this._tamaño -= 1;
      eliminados += 1;
    }

    if (!this.cabeza) {
      this.cola = null;
      return eliminados;
    }

    let anterior = this.cabeza;
    let actual = this.cabeza.siguiente;

    while (actual) {
      if (predicado(actual.valor)) {
        anterior.siguiente = actual.siguiente;

        if (actual === this.cola) {
          this.cola = anterior;
        }

        this._tamaño -= 1;
        eliminados += 1;
        actual = anterior.siguiente;
        continue;
      }

      anterior = actual;
      actual = actual.siguiente;
    }

    return eliminados;
  }

  buscar(predicado: (valor: T) => boolean): T | undefined {
    let actual = this.cabeza;

    while (actual) {
      if (predicado(actual.valor)) {
        return actual.valor;
      }

      actual = actual.siguiente;
    }

    return undefined;
  }

  recorrer(visitante?: (valor: T, indice: number) => void): T[] {
    const valores: T[] = [];
    let actual = this.cabeza;
    let indice = 0;

    while (actual) {
      valores.push(actual.valor);
      visitante?.(actual.valor, indice);
      actual = actual.siguiente;
      indice += 1;
    }

    return valores;
  }

  vaciar(): void {
    this.cabeza = null;
    this.cola = null;
    this._tamaño = 0;
  }
}
