# Prompt para agente LLM — Árbol binario de búsqueda (Fase 4)

Copia y pega TODO este documento al otro agente. No improvisar otra estructura ni otro módulo.

---

## Rol

Eres un agente de implementación en el repo **App-ControlGastos** (Expo + React Native + TypeScript). Debes cumplir el requisito académico de **árbol binario** con uso real en la app. Responde y comenta código en español si el usuario del proyecto lo usa.

## Contexto del proyecto

App de control de gastos. Estado financiero en Redux Toolkit (`src/store/slices/financeSlice.ts`). Las estructuras propias viven en `src/structures/` y **no se guardan nodos/punteros en Redux** (Immer no sirve para eso). El patrón ya establecido es:

1. Clase genérica con nodos propios.
2. Repositorio singleton que usa esa clase.
3. Tras mutar, se recorre la estructura y se copia un snapshot serializable al slice para la UI.
4. `resetFinanceState` (logout) vacía la estructura.

### Ya implementado (NO tocar salvo integración mínima)

| Estructura | Archivos | Uso real |
|---|---|---|
| Lista enlazada | `ListaEnlazada.ts`, `movimientosLista.ts` | Colección principal de `MovementItem`: insertar, eliminar, buscar, recorrer |
| Pila LIFO | `Pila.ts`, `historialMovimientos.ts` | Deshacer/rehacer crear-editar-eliminar movimientos (botones en Inicio) |
| Cola FIFO | `Cola.ts`, `colaPagos.ts` | Pagos programados del mes; `encolar` por `dueDate`; botón **Atender siguiente** hace `desencolar` |

No reescribas lista, pila ni cola. No uses `Array.sort` como si fuera el árbol. No uses el Stack de React Navigation como árbol.

## Requisito obligatorio (enunciado)

Árbol binario para organización jerárquica o búsqueda eficiente.

Debe permitir:

- Insertar
- Buscar
- Recorridos: **inorden**, **preorden**, **postorden**

Ejemplos del enunciado: catálogo ordenado, ranking, clasificación por prioridad.

Criterio de hecho:

- Insertar un dato cambia el ranking.
- Buscar por la clave del árbol encuentra el nodo.
- Los tres recorridos existen en código y **al menos uno se ve en la UI** (inorden = ordenado). Preferible mostrar los tres.

## Funcionalidad que debes construir

**Ranking de metas de ahorro (`SavingsMeta`) en un BST por `montoObjetivo`.**

Por qué esta y no otra:

- Inicio ya tiene deshacer (pila) y pagos programados (cola). No satures esa pantalla.
- `MetasScreen` (`src/screens/metas/MetasScreen.tsx`) hoy lista `savingsMetas` como array plano.
- Un BST por monto objetivo cumple “catálogo ordenado / ranking”.
- Inorden = de menor a mayor meta. Preorden y postorden se muestran como recorridos del mismo árbol (requisito académico).

Clave de ordenamiento: `montoObjetivo` (number). Si dos metas empatan, desempata con `id` (string) para que el árbol sea determinista.

Tipo: `src/constants/sampleData.ts` → `SavingsMeta` (`id`, `nombre`, `montoObjetivo`, `montoActual`, `prioridad`, `estado`, etc.).

Datos: llegan de Supabase vía `fetchSavingsMetasThunk`, `addSavingsMetaThunk`, `updateSavingsMetaThunk` en `financeSlice.ts`.

## Diseño técnico (obligatorio)

### 1. Clase `ArbolBinario` / BST

Crear `src/structures/ArbolBinario.ts`:

- `NodoArbol<T>` con `valor`, `izquierdo`, `derecho`.
- Clase genérica `ArbolBinario<T>` (o `ArbolBinarioBusqueda<T>`).
- Recibe un comparador `(a: T, b: T) => number`.
- Métodos mínimos:
  - `insertar(valor: T): void`
  - `buscar(predicado: (valor: T) => boolean): T | undefined` (o buscar por clave)
  - `inorden(): T[]`
  - `preorden(): T[]`
  - `postorden(): T[]`
  - `vaciar(): void`
  - `tamaño` / `estaVacio`

Implementación propia con punteros. Prohibido: envolver un array y llamarlo árbol.

### 2. Repositorio `rankingMetas.ts`

Crear `src/structures/rankingMetas.ts`:

- Una instancia del BST de `SavingsMeta`.
- `reconstruir(metas: SavingsMeta[]): void` — `vaciar` + `insertar` cada meta.
- `buscarPorId(id: string)` o `buscarPorMonto(monto: number)` usando el método `buscar` del árbol.
- `inorden()`, `preorden()`, `postorden()` delegando al árbol.
- `vaciar()` en logout.

Comparador sugerido:

```ts
function compararMetas(a: SavingsMeta, b: SavingsMeta): number {
  if (a.montoObjetivo !== b.montoObjetivo) {
    return a.montoObjetivo - b.montoObjetivo;
  }
  return a.id.localeCompare(b.id);
}
```

### 3. Redux — snapshot, no nodos

En `FinanceState` añade algo equivalente a:

- `rankingInorden: SavingsMeta[]`
- `rankingPreorden: SavingsMeta[]`
- `rankingPostorden: SavingsMeta[]`
- opcional: `metaEncontradaId: string | null` para el resultado de buscar

Helper `sincronizarRankingEnEstado(state)` que llame a inorden/preorden/postorden y copie arrays al slice.

Llamarlo:

- Tras `fetchSavingsMetasThunk.fulfilled`
- Tras `addSavingsMetaThunk.fulfilled` / `updateSavingsMetaThunk.fulfilled`
- En `addSavingsMeta` / `updateSavingsMeta` si esos reducers síncronos siguen existiendo
- En `resetFinanceState`: `rankingMetas.vaciar()` y arrays vacíos

No guardes el árbol en el store.

Exporta acciones/selectores que la UI necesite (`selectRankingInorden`, etc.).

### 4. UI en Metas

En `MetasScreen`:

- Selector o tabs: **Inorden** | **Preorden** | **Postorden**.
- La lista visible sale **solo** del recorrido elegido (no de `.sort()` sobre el array de Redux original).
- Texto breve que explique: inorden = ranking menor → mayor `montoObjetivo`.
- Campo o botón **Buscar** (por monto objetivo o por nombre/id) que use `arbol.buscar(...)` y resalte o muestre la meta encontrada.
- Al crear o editar una meta (flujo `MetaForm` ya existente), el ranking debe actualizarse solo con el snapshot; no hace falta una pantalla nueva de formulario.

Mantén el estilo actual (theme, `ScreenHeader`, `MetaListItem`).

### 5. Logout

`resetFinanceState` ya vacía lista, historial (pilas) y cola. Debes vaciar también el BST.

## Restricciones

- TypeScript estricto. Sin `any` innecesarios.
- No instales dependencias nuevas.
- No hagas commit ni push.
- No “cumplas” el árbol con `savingsMetas.slice().sort(...)`.
- No implementes tabla hash ni grafo en esta tarea.
- No rompas deshacer/rehacer ni la cola de pagos.
- Responde en español al usuario del repo si aplica.

## Orden de trabajo

1. Implementar `ArbolBinario.ts` y probar mentalmente insertar / buscar / tres recorridos (vacío, un nodo, varios, empate de monto).
2. Implementar `rankingMetas.ts`.
3. Exportar en `src/structures/index.ts`.
4. Enganchar `financeSlice` + selectores.
5. UI en `MetasScreen`.
6. Vaciar en logout.
7. Verificar a mano: crear meta con monto alto/bajo, ver que inorden cambia; buscar; cambiar a preorden/postorden y que el orden sea distinto.

## Cómo demostrar en la defensa (para que el código lo permita)

1. Abrir Metas.
2. Mostrar inorden (ordenado por `montoObjetivo`).
3. Crear una meta nueva → aparece en la posición correcta del inorden.
4. Buscar por monto o id usando el árbol.
5. Cambiar a preorden y postorden y explicar la diferencia.

## Archivos que casi seguro tocarás

- `src/structures/ArbolBinario.ts` (nuevo)
- `src/structures/rankingMetas.ts` (nuevo)
- `src/structures/index.ts`
- `src/store/slices/financeSlice.ts`
- `src/store/selectors/financeSelectors.ts`
- `src/screens/metas/MetasScreen.tsx`

## Definition of done

- [ ] Clase BST propia con insertar, buscar, inorden, preorden, postorden
- [ ] Metas se insertan en el árbol al cargar/crear/editar
- [ ] La lista de ranking en UI sale de un recorrido, no de `Array.sort`
- [ ] Los tres recorridos están implementados; inorden se ve; los otros dos se pueden mostrar
- [ ] Buscar usa el árbol
- [ ] Logout vacía el árbol
- [ ] Lista enlazada, pila y cola siguen funcionando
