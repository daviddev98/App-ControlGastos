export class Grafo {
  private adyacencia: Record<string, string[]> = {};

  agregarVertice(vertice: string): void {
    if (!this.adyacencia[vertice]) {
      this.adyacencia[vertice] = [];
    }
  }

  agregarArista(origen: string, destino: string): void {
    this.agregarVertice(origen);
    this.agregarVertice(destino);

    if (!this.adyacencia[origen].includes(destino)) {
      this.adyacencia[origen].push(destino);
    }

    if (!this.adyacencia[destino].includes(origen)) {
      this.adyacencia[destino].push(origen);
    }
  }

  vecinos(vertice: string): string[] {
    return [...(this.adyacencia[vertice] ?? [])];
  }

  vertices(): string[] {
    return Object.keys(this.adyacencia);
  }

  bfs(inicio: string): string[] {
    if (!this.adyacencia[inicio]) {
      return [];
    }

    const visitados = new Set<string>([inicio]);
    const orden: string[] = [];
    const pendientes: string[] = [inicio];

    while (pendientes.length > 0) {
      const actual = pendientes.shift();
      if (!actual) {
        break;
      }

      orden.push(actual);

      for (const vecino of this.adyacencia[actual] ?? []) {
        if (!visitados.has(vecino)) {
          visitados.add(vecino);
          pendientes.push(vecino);
        }
      }
    }

    return orden;
  }

  dfs(inicio: string): string[] {
    if (!this.adyacencia[inicio]) {
      return [];
    }

    const visitados = new Set<string>();
    const orden: string[] = [];
    this.dfsRecursivo(inicio, visitados, orden);
    return orden;
  }

  private dfsRecursivo(actual: string, visitados: Set<string>, orden: string[]): void {
    visitados.add(actual);
    orden.push(actual);

    for (const vecino of this.adyacencia[actual] ?? []) {
      if (!visitados.has(vecino)) {
        this.dfsRecursivo(vecino, visitados, orden);
      }
    }
  }

  vaciar(): void {
    this.adyacencia = {};
  }
}
