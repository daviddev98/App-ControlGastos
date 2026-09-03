from pathlib import Path

from fpdf import FPDF

OUTPUT = Path(__file__).with_name("Plan_Trabajo_Estructuras_Datos.pdf")
FONT_DIR = Path(r"C:\Windows\Fonts")


class PlanPDF(FPDF):
    def __init__(self) -> None:
        super().__init__(format="Letter", unit="mm")
        self.set_auto_page_break(auto=True, margin=18)
        self.add_font("Body", "", str(FONT_DIR / "calibri.ttf"))
        self.add_font("Body", "B", str(FONT_DIR / "calibrib.ttf"))
        self.add_font("Body", "I", str(FONT_DIR / "calibrii.ttf"))
        self.navy = (15, 32, 56)
        self.teal = (14, 116, 144)
        self.gold = (201, 162, 39)
        self.muted = (90, 100, 112)
        self.line_gray = (220, 226, 232)

    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_fill_color(*self.navy)
        self.rect(0, 0, 216, 12, "F")
        self.set_text_color(255, 255, 255)
        self.set_font("Body", "", 9)
        self.set_xy(16, 3.5)
        self.cell(0, 5, "Control de Gastos  ·  Plan de trabajo — estructuras de datos", align="L")
        self.set_xy(-40, 3.5)
        self.cell(24, 5, "UNITEC  ·  2026", align="R")
        self.set_y(18)

    def footer(self) -> None:
        if self.page_no() == 1:
            return
        self.set_y(-14)
        self.set_draw_color(*self.line_gray)
        self.line(16, self.get_y(), 200, self.get_y())
        self.set_text_color(*self.muted)
        self.set_font("Body", "", 8)
        self.cell(0, 8, f"Página {self.page_no() - 1}", align="R")

    def section(self, title: str) -> None:
        self.ln(3)
        self.set_fill_color(*self.teal)
        self.rect(16, self.get_y(), 2.2, 7.2, "F")
        self.set_xy(21, self.get_y())
        self.set_text_color(*self.navy)
        self.set_font("Body", "B", 14)
        self.cell(0, 7.2, title, ln=True)
        self.ln(2)

    def body(self, text: str) -> None:
        self.set_text_color(40, 48, 58)
        self.set_font("Body", "", 11)
        self.set_x(16)
        self.multi_cell(184, 5.6, text)
        self.ln(1.5)

    def italic(self, text: str) -> None:
        self.set_text_color(*self.muted)
        self.set_font("Body", "I", 10.5)
        self.set_x(16)
        self.multi_cell(184, 5.4, text)
        self.ln(1)

    def bullet(self, title: str, text: str) -> None:
        self.set_x(16)
        self.set_font("Body", "B", 11)
        self.set_text_color(*self.navy)
        self.multi_cell(184, 5.5, f"•  {title}")
        self.set_x(22)
        self.set_font("Body", "", 10.5)
        self.set_text_color(50, 58, 68)
        self.multi_cell(178, 5.3, text)
        self.ln(1)

    def numbered(self, number: str, title: str, text: str) -> None:
        y = self.get_y()
        if y > 250:
            self.add_page()
            y = self.get_y()
        self.set_fill_color(*self.teal)
        self.set_text_color(255, 255, 255)
        self.set_font("Body", "B", 10)
        self.set_xy(16, y)
        self.cell(8, 6, number, align="C", fill=True)
        self.set_xy(26, y)
        self.set_text_color(*self.navy)
        self.set_font("Body", "B", 11.5)
        self.cell(0, 6, title, ln=True)
        self.set_x(26)
        self.set_font("Body", "", 10.5)
        self.set_text_color(50, 58, 68)
        self.multi_cell(174, 5.3, text)
        self.ln(2.2)

    def table(self, headers: list[str], rows: list[list[str]], col_widths: list[float]) -> None:
        self.set_x(16)
        self.set_fill_color(*self.navy)
        self.set_text_color(255, 255, 255)
        self.set_font("Body", "B", 9.5)
        for header, width in zip(headers, col_widths):
            self.cell(width, 7.2, header, border=0, fill=True)
        self.ln()
        self.set_font("Body", "", 9)
        for i, row in enumerate(rows):
            if self.get_y() > 252:
                self.add_page()
                self.set_x(16)
                self.set_fill_color(*self.navy)
                self.set_text_color(255, 255, 255)
                self.set_font("Body", "B", 9.5)
                for header, width in zip(headers, col_widths):
                    self.cell(width, 7.2, header, border=0, fill=True)
                self.ln()
                self.set_font("Body", "", 9)
            fill = i % 2 == 0
            self.set_fill_color(241, 246, 248) if fill else self.set_fill_color(255, 255, 255)
            self.set_text_color(40, 48, 58)
            y_start = self.get_y()
            x_start = 16
            heights = []
            for value, width in zip(row, col_widths):
                heights.append(self.get_string_width(value) and None)
            line_height = 5.1
            wrapped = [self._wrap(value, width - 2) for value, width in zip(row, col_widths)]
            row_h = max(len(lines) for lines in wrapped) * line_height + 2.4
            self.set_xy(x_start, y_start)
            for value_lines, width in zip(wrapped, col_widths):
                x = self.get_x()
                y = self.get_y()
                self.rect(x, y, width, row_h, "F")
                self.set_xy(x + 1, y + 1.2)
                self.multi_cell(width - 2, line_height, "\n".join(value_lines))
                self.set_xy(x + width, y)
            self.set_y(y_start + row_h)
        self.ln(3)

    def _wrap(self, text: str, width: float) -> list[str]:
        words = text.split(" ")
        lines: list[str] = []
        current = ""
        for word in words:
            trial = word if not current else f"{current} {word}"
            if self.get_string_width(trial) <= width:
                current = trial
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        return lines or [""]

    def check(self, text: str) -> None:
        self.set_x(16)
        self.set_font("Body", "", 10.5)
        self.set_text_color(40, 48, 58)
        self.multi_cell(184, 5.4, f"  [  ]  {text}")
        self.ln(0.4)


def build() -> None:
    pdf = PlanPDF()
    pdf.set_title("Plan de trabajo — Estructuras de datos en Control de Gastos")
    pdf.set_author("Equipo Control de Gastos")
    pdf.set_creator("App-ControlGastos")

    # Portada
    pdf.add_page()
    pdf.set_fill_color(*pdf.navy)
    pdf.rect(0, 0, 216, 279, "F")
    pdf.set_fill_color(*pdf.teal)
    pdf.rect(0, 0, 8, 279, "F")
    pdf.set_fill_color(*pdf.gold)
    pdf.rect(0, 248, 216, 4, "F")

    pdf.set_text_color(180, 210, 220)
    pdf.set_font("Body", "", 12)
    pdf.set_xy(28, 42)
    pdf.cell(0, 8, "PROYECTO ACADÉMICO  ·  PROGRAMACIÓN  ·  2026")

    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Body", "B", 32)
    pdf.set_xy(28, 62)
    pdf.multi_cell(160, 12, "Plan de trabajo")

    pdf.set_font("Body", "", 18)
    pdf.set_xy(28, 90)
    pdf.multi_cell(160, 9, "Integración de estructuras de datos en Control de Gastos")

    pdf.set_draw_color(*pdf.teal)
    pdf.set_line_width(1.1)
    pdf.line(28, 118, 92, 118)

    pdf.set_font("Body", "", 12)
    pdf.set_text_color(210, 224, 232)
    pdf.set_xy(28, 128)
    pdf.multi_cell(
        160,
        6.5,
        "Documento operativo para que la aplicación cumpla los seis requisitos "
        "obligatorios: lista enlazada, pila, cola FIFO, árbol binario, tabla hash y grafo. "
        "Cada estructura debe tener implementación propia y un propósito real en el producto.",
    )

    pdf.set_xy(28, 178)
    pdf.set_font("Body", "B", 11)
    pdf.set_text_color(*pdf.gold)
    pdf.cell(0, 7, "Estado de esta entrega")
    pdf.set_xy(28, 186)
    pdf.set_font("Body", "", 11)
    pdf.set_text_color(230, 238, 242)
    pdf.multi_cell(
        160,
        6.2,
        "Fase 1 completada: la lista enlazada es la colección principal de movimientos, "
        "con insertar, eliminar, buscar y recorrer conectados a la app y a Supabase.",
    )

    pdf.set_xy(28, 230)
    pdf.set_font("Body", "", 10)
    pdf.set_text_color(170, 190, 200)
    pdf.cell(0, 6, "Aplicación: Control de Gastos  ·  Expo + React Native + TypeScript")
    pdf.set_xy(28, 237)
    pdf.cell(0, 6, "Repositorio: App-ControlGastos")

    # 1. Objetivo
    pdf.add_page()
    pdf.section("1. Objetivo del plan")
    pdf.body(
        "Definir el orden de trabajo, las responsabilidades técnicas y los criterios de "
        "aceptación para incorporar las seis estructuras de datos exigidas, sin romper "
        "el flujo actual de autenticación, navegación, Redux y sincronización con Supabase."
    )
    pdf.body(
        "El resultado esperado no es un conjunto de clases aisladas. Cada estructura debe "
        "intervenir en un flujo que el usuario (o el docente en la demo) pueda observar: "
        "crear, buscar, deshacer, procesar en orden, clasificar, localizar por clave o recorrer relaciones."
    )

    pdf.section("2. Diagnóstico inicial")
    pdf.body("Antes de este plan, el dominio financiero se modelaba así:")
    pdf.bullet("Colecciones", "Cuentas, movimientos y metas vivían en arrays nativos (Account[], MovementItem[], SavingsMeta[]).")
    pdf.bullet("Cachés", "Redux usaba Record<string, MovementItem[]> para agrupar por mes y por cuenta. Eso no demuestra tabla hash propia ni manejo de colisiones.")
    pdf.bullet("Navegación", "React Navigation Stack organiza pantallas. No es una pila LIFO de dominio (deshacer, historial de acciones o estados).")
    pdf.bullet("Vacío total", "No existían cola FIFO, árbol binario ni grafo. Tampoco había eliminar movimiento, operación indispensable para la lista enlazada.")
    pdf.italic(
        "Regla de oro: un Array, un objeto de JavaScript o el Stack de React Navigation no sustituyen la implementación académica exigida."
    )

    pdf.section("3. Principios de implementación")
    pdf.numbered("01", "Implementación propia", "Clases TypeScript en src/structures/. Nodos, punteros o cubetas deben ser visibles en el código.")
    pdf.numbered("02", "Propósito real", "La estructura opera un flujo del producto. No basta con crearla y no usarla.")
    pdf.numbered("03", "Operaciones completas", "Cada requisito lista operaciones mínimas. Si pide insertar, eliminar, buscar y recorrer, las cuatro deben ejecutarse desde la app.")
    pdf.numbered("04", "Conviven con Redux y Supabase", "La estructura es la fuente de verdad en memoria. Redux guarda un snapshot para pintar la UI. Supabase persiste en la nube.")
    pdf.numbered("05", "Demo defendible", "Al final de cada fase debe existir un recorrido oral de 60–90 segundos que muestre para qué sirve la estructura.")

    # Flujo
    pdf.add_page()
    pdf.section("4. Flujo general de actividades")
    pdf.body("El trabajo se ejecuta en serie. Cada fase cierra con código integrado, prueba manual y evidencia para la presentación.")
    pdf.table(
        ["Fase", "Estructura", "Resultado visible", "Estado"],
        [
            ["0", "Preparación", "Carpeta src/structures y reglas de integración", "Hecha"],
            ["1", "Lista enlazada", "CRUD de movimientos sobre nodos", "Hecha"],
            ["2", "Pila LIFO", "Deshacer crear, editar o borrar", "Pendiente"],
            ["3", "Cola FIFO", "Pagos o sincronización en orden de llegada", "Pendiente"],
            ["4", "Árbol binario", "Ranking o catálogo con recorridos", "Pendiente"],
            ["5", "Tabla hash", "Búsqueda por clave con colisiones", "Pendiente"],
            ["6", "Grafo", "Relaciones entre cuentas o metas + BFS/DFS", "Pendiente"],
            ["7", "Cierre", "Demo, FAQ y criterios de aceptación", "Pendiente"],
        ],
        [18, 38, 92, 36],
    )

    pdf.body("Secuencia recomendada de un ciclo de fase:")
    pdf.bullet("Diseñar el uso", "Elegir el flujo de negocio que justifica la estructura dentro de Control de Gastos.")
    pdf.bullet("Implementar la clase", "Operaciones, tipos genéricos y casos borde (vacía, un elemento, no encontrado).")
    pdf.bullet("Conectar el dominio", "El servicio o slice llama a la estructura; la UI no opera arrays “en paralelo”.")
    pdf.bullet("Exponer en pantalla", "El usuario dispara insertar, eliminar, buscar, deshacer, encolar o recorrer.")
    pdf.bullet("Verificar", "Probar el flujo feliz, un error y el cierre de sesión. Confirmar que no quedan datos de otro usuario.")
    pdf.bullet("Documentar para defensa", "Una frase de propósito + dónde está el código + qué se ve en la demo.")

    pdf.section("5. Fase 0 — Preparación")
    pdf.body(
        "Crear src/structures/ como único lugar de las estructuras. Redux no debe guardar nodos con punteros: Immer y la serialización no son adecuadas para eso. "
        "El patrón acordado es: la clase vive en un repositorio en memoria; tras cada mutación se recorre la estructura y se actualiza el snapshot de Redux para la UI."
    )
    pdf.body("Archivos base: ListaEnlazada.ts, movimientosLista.ts e index.ts. Las fases siguientes añaden Pila.ts, Cola.ts, ArbolBinario.ts, TablaHash.ts y Grafo.ts.")

    # Fase 1 detalle
    pdf.add_page()
    pdf.section("6. Fase 1 — Lista enlazada  (completada)")
    pdf.italic("Propósito obligatorio: almacenar la colección principal de objetos, con insertar, eliminar, buscar y recorrer.")
    pdf.body(
        "Decisión: los movimientos son la colección principal de la app (Inicio, detalle de cuenta, estadísticas y formulario). "
        "Por eso la lista enlazada es la fuente de verdad en memoria de MovementItem."
    )
    pdf.bullet("Clase", "ListaEnlazada<T> con Nodo (valor + siguiente). Métodos: insertar, insertarAlInicio, insertarAlFinal, eliminar, eliminarTodos, buscar, recorrer y vaciar.")
    pdf.bullet("Repositorio", "movimientosLista envuelve la lista: insertar un movimiento, eliminarlo por id, buscarlo por id, recorrer todos, reemplazar un mes y fusionar los de una cuenta.")
    pdf.bullet("Insertar", "Al crear un movimiento (addMovimientoThunk) o al actualizarlo. También al cargar el mes o la cuenta desde Supabase.")
    pdf.bullet("Eliminar", "Nuevo deleteMovimientoThunk + botón Eliminar en Editar registro. Quita el nodo y borra la fila en Supabase.")
    pdf.bullet("Buscar", "selectMovimientoById usa movimientosLista.buscar(id) para abrir el formulario de edición.")
    pdf.bullet("Recorrer", "construirSnapshotMovimientos recorre la lista y arma las vistas por mes y por cuenta que pinta la UI.")
    pdf.body(
        "Cierre de sesión: resetFinanceState vacía la lista para que el siguiente usuario no herede nodos ajenos. "
        "Esto es parte del propósito real, no un detalle opcional."
    )
    pdf.body("Actividades de cierre de esta fase:")
    pdf.check("Crear un gasto y verlo en Inicio (insertar + recorrer).")
    pdf.check("Abrir ese gasto (buscar por id) y editarlo.")
    pdf.check("Eliminarlo y confirmar que desaparece de Inicio y de la cuenta.")
    pdf.check("Cerrar sesión y entrar con otra cuenta: la lista debe nacer vacía.")

    pdf.section("7. Fase 2 — Pila (LIFO)")
    pdf.italic("Propósito: historial deshacer/rehacer, registro de acciones o control de estados. El Stack de navegación no cuenta.")
    pdf.body("Actividades:")
    pdf.numbered("1", "Implementar Pila<T>", "push, pop, peek e isEmpty. Opcional: pila de rehacer.")
    pdf.numbered("2", "Modelar la acción", "Tipo HistorialAccion con crear, editar y eliminar movimiento, más el snapshot necesario para revertir.")
    pdf.numbered("3", "Empujar al guardar", "Tras insertar, actualizar o eliminar con éxito, hacer push de la acción inversa.")
    pdf.numbered("4", "Botón Deshacer", "En Inicio o en el formulario. pop + aplicar la acción inversa sobre la lista enlazada y Supabase.")
    pdf.numbered("5", "Límite y limpieza", "Tope de N acciones y vaciar la pila al cerrar sesión.")
    pdf.body("Criterio de hecho: el usuario crea un gasto, pulsa Deshacer y el gasto desaparece; si había edición, vuelve el valor anterior.")

    # Fase 3-6
    pdf.add_page()
    pdf.section("8. Fase 3 — Cola FIFO")
    pdf.italic("Propósito: turnos, procesamiento de tareas o solicitudes pendientes. First in, first out.")
    pdf.body("Uso recomendado en este producto (elegir uno y llevarlo hasta la UI):")
    pdf.bullet("Opción A — Pagos programados", "Los vencimientos se encolan por fecha. El frente de la cola es el siguiente pago a atender.")
    pdf.bullet("Opción B — Sincronización", "Si una operación falla por red, se encola y se procesa en orden al reconectar.")
    pdf.body("Actividades:")
    pdf.numbered("1", "Implementar Cola<T>", "enqueue, dequeue, front e isEmpty.")
    pdf.numbered("2", "Alimentar la cola", "Desde movimientos con dueDate o desde fallos de thunks.")
    pdf.numbered("3", "Procesar el frente", "Botón o efecto que atiende el primer elemento y lo saca de la cola.")
    pdf.numbered("4", "Mostrar pendientes", "Lista “en cola” para que el FIFO se vea, no solo se infiera.")
    pdf.body("Criterio de hecho: el orden de salida coincide con el de llegada; no se atiende un elemento posterior antes que el frente.")

    pdf.section("9. Fase 4 — Árbol binario")
    pdf.italic("Propósito: organización jerárquica o búsqueda eficiente. Debe insertar, buscar e inorden / preorden / postorden.")
    pdf.body("Uso recomendado: árbol de búsqueda por monto (movimientos) o por montoObjetivo / prioridad (metas). El inorden entrega el ranking ordenado.")
    pdf.body("Actividades:")
    pdf.numbered("1", "Implementar BST", "Nodo con izquierdo y derecho. insertar, buscar, inorden, preorden y postorden.")
    pdf.numbered("2", "Reconstruir al recorrer la lista", "Tras sincronizar movimientos, armar el árbol desde la lista enlazada. Así lista y árbol colaboran.")
    pdf.numbered("3", "Pantalla o sección Ranking", "Mostrar al menos un recorrido (inorden = menor a mayor gasto) y poder buscar un monto.")
    pdf.numbered("4", "Defensa oral", "Explicar por qué inorden ordena, y qué muestran preorden y postorden.")
    pdf.body("Criterio de hecho: insertar un movimiento cambia el ranking; buscar por clave del árbol encuentra el nodo; los tres recorridos están implementados y uno se ve en UI.")

    pdf.section("10. Fase 5 — Tabla hash")
    pdf.italic("Propósito: búsqueda rápida por clave, con manejo explícito de colisiones. Record o Map nativos no bastan.")
    pdf.body("Uso recomendado: diccionario id → movimiento (y, si aplica, email → sesión local). selectMovimientoById puede pasar de la lista lineal a la tabla cuando esta fase cierre, o convivir: la lista es la colección, la hash es el índice.")
    pdf.body("Actividades:")
    pdf.numbered("1", "Implementar TablaHash<K, V>", "Función hash propia, arreglo de cubetas y colisiones por encadenamiento (lista por bucket) o sondeo.")
    pdf.numbered("2", "Operaciones", "set, get y remove. Demostrar dos claves distintas que caigan en el mismo bucket.")
    pdf.numbered("3", "Indexar al insertar/eliminar", "Cada mutación de la lista enlazada actualiza la tabla.")
    pdf.numbered("4", "Usar get en búsqueda", "Editar movimiento y cualquier lookup por id deben pasar por la tabla.")
    pdf.body("Criterio de hecho: hay código de colisiones; una búsqueda por id no recorre toda la colección; se puede explicar un ejemplo de colisión.")

    pdf.add_page()
    pdf.section("11. Fase 6 — Grafo")
    pdf.italic("Propósito: relaciones o conexiones. Lista o matriz de adyacencia, más BFS o DFS.")
    pdf.body("Uso recomendado (elegir uno):")
    pdf.bullet("Cuentas", "Aristas = transferencias o “paga desde”. BFS encuentra una ruta entre dos cuentas.")
    pdf.bullet("Metas", "Aristas = dependencias (hay que completar A antes que B). DFS detecta el orden o un ciclo.")
    pdf.bullet("Categorías", "Red de categorías relacionadas para sugerir clasificación.")
    pdf.body("Actividades:")
    pdf.numbered("1", "Implementar Grafo", "Lista de adyacencia (preferible) o matriz. agregarVertice, agregarArista, vecinos.")
    pdf.numbered("2", "BFS o DFS", "Al menos un recorrido completo, devolviendo el orden visitado.")
    pdf.numbered("3", "Cargar desde datos reales", "Vértices = cuentas o metas del usuario, no un ejemplo hardcodeado ajeno a la app.")
    pdf.numbered("4", "UI de relaciones", "Pantalla o bloque que muestre conexiones y el resultado de BFS/DFS (“ruta sugerida”, “orden de metas”).")
    pdf.body("Criterio de hecho: el grafo se construye con datos del usuario; el recorrido se dispara desde la UI y el orden visitado es visible.")

    pdf.section("12. Fase 7 — Integración, demo y defensa")
    pdf.body("Cuando las seis estructuras estén vivas, unificar el relato de presentación:")
    pdf.bullet("Mapa mental", "Lista = colección de movimientos. Pila = deshacer. Cola = pendientes. Árbol = ranking. Hash = índice por id. Grafo = relaciones.")
    pdf.bullet("Guion de 8 minutos", "Login → crear gasto (lista) → buscar/editar → deshacer (pila) → ver cola → ranking (árbol) → lookup (hash) → recorrido (grafo).")
    pdf.bullet("FAQ", "Actualizar FAQ_PRESENTACION.md con una sección de estructuras: por qué no se usó Array, dónde está cada clase, cómo se demuestra el propósito.")
    pdf.bullet("Limpieza", "Vaciar todas las estructuras al signOut. No dejar nodos, pilas ni colas de un usuario en el siguiente.")

    pdf.section("13. Dependencias entre fases")
    pdf.body(
        "La lista enlazada es la base: pila, cola, árbol y hash se alimentan de mutaciones sobre movimientos. "
        "Por eso el orden 1 → 2 → 3 → 4 → 5 es el de menor retrabajo. El grafo puede avanzar en paralelo a partir de cuentas y metas, "
        "sin esperar el árbol, pero debe respetar el mismo patrón de repositorio en memoria + snapshot de UI."
    )
    pdf.table(
        ["Bloque", "Se apoya en", "No debe hacerse antes de"],
        [
            ["Pila de deshacer", "Insertar / eliminar de la lista", "Fase 1"],
            ["Cola de pendientes", "Movimientos con vencimiento o thunks", "Fase 1"],
            ["Árbol de ranking", "Recorrer la lista para reconstruir", "Fase 1"],
            ["Tabla hash índice", "Ids de la lista; set/remove al mutar", "Fase 1"],
            ["Grafo de cuentas", "Cuentas (y opcionalmente movimientos)", "Fase 0"],
        ],
        [48, 78, 58],
    )

    pdf.add_page()
    pdf.section("14. Criterios de aceptación globales")
    pdf.check("Existen seis clases propias, no wrappers de Array/Map.")
    pdf.check("Cada clase se usa en un flujo real; ninguna queda solo exportada.")
    pdf.check("Lista: insertar, eliminar, buscar y recorrer se ejecutan desde la app.")
    pdf.check("Pila: un Deshacer restaura el estado anterior (LIFO).")
    pdf.check("Cola: el primero en entrar es el primero en atenderse (FIFO).")
    pdf.check("Árbol: insertar, buscar e inorden, preorden y postorden.")
    pdf.check("Hash: función hash propia y estrategia de colisiones visible.")
    pdf.check("Grafo: adyacencia + BFS o DFS sobre datos del usuario.")
    pdf.check("Cerrar sesión limpia todas las estructuras en memoria.")
    pdf.check("Supabase sigue siendo la persistencia; las estructuras no reemplazan la base de datos.")
    pdf.check("La UI existente (Inicio, Cuentas, Metas, Login) no pierde comportamiento.")

    pdf.section("15. Entregables por fase")
    pdf.table(
        ["Fase", "Código", "Evidencia de demo"],
        [
            ["1", "ListaEnlazada + movimientosLista + delete", "Crear, abrir, borrar un movimiento"],
            ["2", "Pila + botón Deshacer", "Crear y deshacer en un gesto"],
            ["3", "Cola + lista de pendientes", "Dos elementos salen en orden"],
            ["4", "BST + ranking", "Inorden visible; búsqueda en árbol"],
            ["5", "TablaHash + get por id", "Explicar una colisión"],
            ["6", "Grafo + BFS/DFS", "Ruta o dependencias en pantalla"],
            ["7", "FAQ y guion", "Defensa continua de 8 minutos"],
        ],
        [22, 82, 80],
    )

    pdf.section("16. Riesgos y cómo atajarlos")
    pdf.bullet("Redux + punteros", "No guardar nodos en el store. Snapshot vía recorrer() después de cada mutación.")
    pdf.bullet("Estructura “de adorno”", "Si la UI sigue usando un array paralelo que no pasa por la clase, el requisito no se cumple. Toda mutación entra por el repositorio.")
    pdf.bullet("Datos de otro usuario", "vaciar() en signOut para lista, pila, cola, árbol, hash y grafo.")
    pdf.bullet("Confundir Stack de navegación con pila", "Dejarlo explícito en la defensa: React Navigation no es el requisito 2.")
    pdf.bullet("Hash nativo", "Record y Map no demuestran colisiones. La clase debe tener cubetas y una estrategia visible.")
    pdf.bullet("Grafo de juguete", "No usar ciudades inventadas. Vértices = cuentas, metas o categorías del usuario.")

    pdf.section("17. Cómo se ve el flujo en la práctica")
    pdf.body(
        "Usuario autenticado → Inicio pide el mes → Supabase devuelve filas → cada movimiento se inserta en la lista enlazada → "
        "recorrer() arma el snapshot de Redux → la pantalla pinta tarjetas. "
        "El usuario abre un movimiento → buscar(id) carga el formulario. "
        "Guarda cambios → se actualiza el nodo y Supabase. "
        "Elimina → se desconecta el nodo y se borra en la nube. "
        "Fases 2 a 6 se enganchan en esos mismos puntos: la pila observa la mutación, la cola observa vencimientos, "
        "el árbol y la hash se reconstruyen o actualizan al recorrer, el grafo se arma con cuentas y relaciones."
    )

    pdf.ln(4)
    pdf.set_fill_color(241, 246, 248)
    pdf.set_draw_color(*pdf.teal)
    pdf.set_line_width(0.5)
    y = pdf.get_y()
    pdf.rect(16, y, 184, 38, "FD")
    pdf.set_xy(22, y + 5)
    pdf.set_font("Body", "B", 12)
    pdf.set_text_color(*pdf.navy)
    pdf.cell(0, 6, "Siguiente paso inmediato")
    pdf.set_xy(22, y + 13)
    pdf.set_font("Body", "", 10.5)
    pdf.set_text_color(50, 58, 68)
    pdf.multi_cell(
        172,
        5.4,
        "Verificar manualmente la Fase 1 (crear, buscar, eliminar, logout) y continuar con la Fase 2: "
        "pila LIFO de deshacer sobre las mismas mutaciones de movimientos. No iniciar el árbol ni el grafo "
        "hasta que Deshacer funcione; así se evita rehacer la integración dos veces.",
    )

    pdf.output(str(OUTPUT))
    print(OUTPUT)


if __name__ == "__main__":
    build()
