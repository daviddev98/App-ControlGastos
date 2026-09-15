class Entrada<K, V> {
  clave: K;
  valor: V;
  siguiente: Entrada<K, V> | null;

  constructor(clave: K, valor: V) {
    this.clave = clave;
    this.valor = valor;
    this.siguiente = null;
  }
}

export class TablaHash<K, V> {
  private cubetas: Array<Entrada<K, V> | null>;
  private _tamaño = 0;
  private readonly capacidad: number;

  constructor(capacidad = 8) {
    this.capacidad = capacidad;
    this.cubetas = Array.from({ length: capacidad }, () => null);
  }

  get tamaño(): number {
    return this._tamaño;
  }

  get cantidadCubetas(): number {
    return this.capacidad;
  }

  private hash(clave: K): number {
    const texto = String(clave);
    let codigo = 5381;

    for (let indice = 0; indice < texto.length; indice += 1) {
      codigo = (codigo * 33) ^ texto.charCodeAt(indice);
    }

    return Math.abs(codigo) % this.capacidad;
  }

  indiceCubeta(clave: K): number {
    return this.hash(clave);
  }

  set(clave: K, valor: V): void {
    const indice = this.hash(clave);
    let actual = this.cubetas[indice];

    while (actual) {
      if (Object.is(actual.clave, clave) || String(actual.clave) === String(clave)) {
        actual.valor = valor;
        return;
      }
      actual = actual.siguiente;
    }

    const entrada = new Entrada(clave, valor);
    entrada.siguiente = this.cubetas[indice];
    this.cubetas[indice] = entrada;
    this._tamaño += 1;
  }

  get(clave: K): V | undefined {
    let actual = this.cubetas[this.hash(clave)];

    while (actual) {
      if (Object.is(actual.clave, clave) || String(actual.clave) === String(clave)) {
        return actual.valor;
      }
      actual = actual.siguiente;
    }

    return undefined;
  }

  remove(clave: K): V | undefined {
    const indice = this.hash(clave);
    let actual = this.cubetas[indice];
    let anterior: Entrada<K, V> | null = null;

    while (actual) {
      if (Object.is(actual.clave, clave) || String(actual.clave) === String(clave)) {
        if (anterior) {
          anterior.siguiente = actual.siguiente;
        } else {
          this.cubetas[indice] = actual.siguiente;
        }
        this._tamaño -= 1;
        return actual.valor;
      }

      anterior = actual;
      actual = actual.siguiente;
    }

    return undefined;
  }

  valores(): V[] {
    const resultado: V[] = [];

    for (const cabeza of this.cubetas) {
      let actual = cabeza;
      while (actual) {
        resultado.push(actual.valor);
        actual = actual.siguiente;
      }
    }

    return resultado;
  }

  cubetasConColision(): number {
    let colisiones = 0;

    for (const cabeza of this.cubetas) {
      if (cabeza?.siguiente) {
        colisiones += 1;
      }
    }

    return colisiones;
  }

  vaciar(): void {
    this.cubetas = Array.from({ length: this.capacidad }, () => null);
    this._tamaño = 0;
  }
}
