from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

OUTPUT = Path(__file__).with_name("Guia_Demo_Estructuras_Datos.pdf")
FONT_DIR = Path(r"C:\Windows\Fonts")


class GuiaPDF(FPDF):
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
        self.cell(0, 5, "Control de Gastos  ·  Guía de demostración — estructuras de datos")
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
        self.ln(2)
        self.set_fill_color(*self.teal)
        self.rect(16, self.get_y(), 2.2, 7.2, "F")
        self.set_xy(21, self.get_y())
        self.set_text_color(*self.navy)
        self.set_font("Body", "B", 14)
        self.cell(0, 7.2, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def body(self, text: str) -> None:
        self.set_text_color(40, 48, 58)
        self.set_font("Body", "", 11)
        self.set_x(16)
        self.multi_cell(184, 5.6, text)
        self.ln(1.2)

    def italic(self, text: str) -> None:
        self.set_text_color(*self.muted)
        self.set_font("Body", "I", 10.5)
        self.set_x(16)
        self.multi_cell(184, 5.4, text)
        self.ln(1)

    def step(self, number: str, text: str) -> None:
        y = self.get_y()
        if y > 248:
            self.add_page()
        self.set_fill_color(*self.teal)
        self.set_text_color(255, 255, 255)
        self.set_font("Body", "B", 9)
        self.set_xy(16, self.get_y())
        self.cell(7, 5.6, number, align="C", fill=True)
        self.set_xy(25, self.get_y())
        self.set_text_color(50, 58, 68)
        self.set_font("Body", "", 10.5)
        self.multi_cell(175, 5.5, text)
        self.ln(1.2)

    def table(self, headers: list[str], rows: list[list[str]], col_widths: list[float]) -> None:
        self.set_x(16)
        self.set_fill_color(*self.navy)
        self.set_text_color(255, 255, 255)
        self.set_font("Body", "B", 9)
        for header, width in zip(headers, col_widths):
            self.cell(width, 7, header, border=0, fill=True)
        self.ln()
        self.set_font("Body", "", 9)
        for i, row in enumerate(rows):
            if self.get_y() > 250:
                self.add_page()
                self.set_x(16)
                self.set_fill_color(*self.navy)
                self.set_text_color(255, 255, 255)
                self.set_font("Body", "B", 9)
                for header, width in zip(headers, col_widths):
                    self.cell(width, 7, header, border=0, fill=True)
                self.ln()
                self.set_font("Body", "", 9)
            fill = i % 2 == 0
            self.set_fill_color(241, 246, 248) if fill else self.set_fill_color(255, 255, 255)
            self.set_text_color(40, 48, 58)
            y_start = self.get_y()
            wrapped = [self._wrap(value, width - 2.4) for value, width in zip(row, col_widths)]
            line_height = 4.8
            row_h = max(len(lines) for lines in wrapped) * line_height + 2.2
            x = 16
            for value_lines, width in zip(wrapped, col_widths):
                self.rect(x, y_start, width, row_h, "F")
                self.set_xy(x + 1.2, y_start + 1.1)
                self.multi_cell(width - 2.4, line_height, "\n".join(value_lines))
                x += width
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


def build() -> None:
    pdf = GuiaPDF()
    pdf.set_title("Guía de demostración — Estructuras de datos")
    pdf.set_author("Control de Gastos")

    pdf.add_page()
    pdf.set_fill_color(*pdf.navy)
    pdf.rect(0, 0, 216, 279, "F")
    pdf.set_fill_color(*pdf.teal)
    pdf.rect(0, 0, 8, 279, "F")
    pdf.set_fill_color(*pdf.gold)
    pdf.rect(0, 248, 216, 4, "F")

    pdf.set_text_color(180, 210, 220)
    pdf.set_font("Body", "", 12)
    pdf.set_xy(28, 48)
    pdf.cell(0, 8, "DEMOSTRACIÓN EN LA INTERFAZ  ·  2026")

    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Body", "B", 30)
    pdf.set_xy(28, 68)
    pdf.multi_cell(160, 12, "Guía corta de prueba")

    pdf.set_font("Body", "", 16)
    pdf.set_xy(28, 98)
    pdf.multi_cell(160, 8, "Cómo verificar las seis estructuras de datos usando solo la app")

    pdf.set_draw_color(*pdf.teal)
    pdf.set_line_width(1.1)
    pdf.line(28, 124, 92, 124)

    pdf.set_font("Body", "", 12)
    pdf.set_text_color(210, 224, 232)
    pdf.set_xy(28, 136)
    pdf.multi_cell(
        160,
        6.4,
        "Cada requisito se demuestra en un flujo distinto: lista (movimientos), pila (deshacer), "
        "cola (pagos programados), árbol (metas), tabla hash (cuentas) y grafo (red de categorías).",
    )

    pdf.set_xy(28, 220)
    pdf.set_font("Body", "", 10)
    pdf.set_text_color(170, 190, 200)
    pdf.cell(0, 6, "Control de Gastos  ·  Expo + React Native")

    # Preparación
    pdf.add_page()
    pdf.section("Preparación")
    pdf.body("Usa un usuario con el que puedas crear cuentas, movimientos y metas. Tabs: Metas | Inicio | Cuentas. El botón + registra un movimiento. El engranaje abre Configuración.")
    pdf.step("1", "Inicia sesión.")
    pdf.step("2", "En Cuentas crea al menos 2 cuentas si no tienes.")
    pdf.step("3", "En Inicio pulsa + y registra 2 o 3 gastos del mes actual, con días de vencimiento distintos (por ejemplo 5, 12 y 20).")
    pdf.step("4", "En Metas crea 2 o 3 metas con montos objetivo distintos (por ejemplo 1 000, 5 000 y 2 500).")

    pdf.section("1. Lista enlazada — movimientos")
    pdf.italic("Insertar, buscar, recorrer y eliminar la colección principal. Inicio → Movimientos y el formulario del +.")
    pdf.table(
        ["Operación", "Qué hacer", "Qué debe pasar"],
        [
            ["Insertar", "+ → Gasto o Ingreso → guardar", "El registro aparece en Movimientos"],
            ["Recorrer", "Volver a Inicio y ver la lista del mes", "Se listan todos los del mes"],
            ["Buscar", "Tocar un movimiento", "Abre Editar registro (búsqueda por id)"],
            ["Eliminar", "En edición: Eliminar movimiento", "Desaparece de Inicio y del detalle de cuenta"],
        ],
        [32, 78, 74],
    )
    pdf.body("Cierre de sesión: Configuración → Cerrar sesión. Entra con otra cuenta: no deben quedar movimientos del usuario anterior.")

    pdf.section("2. Pila LIFO — deshacer / rehacer")
    pdf.italic("El último cambio es el primero que se revierte. No es el Stack de React Navigation. Botones Deshacer y Rehacer en Inicio.")
    pdf.step("1", "Anota cuántos movimientos ves.")
    pdf.step("2", "Crea un gasto nuevo (por ejemplo “Prueba pila”).")
    pdf.step("3", "En Inicio el texto debe decir algo como: Siguiente: deshacer registro de Prueba pila.")
    pdf.step("4", "Pulsa Deshacer: ese gasto desaparece.")
    pdf.step("5", "Pulsa Rehacer: vuelve.")
    pdf.step("6", "LIFO: crea gasto A y luego B. Deshacer quita B primero, no A.")
    pdf.step("7", "Edita un movimiento y deshaz: vuelve el valor anterior.")
    pdf.step("8", "Elimina uno y deshaz: se recupera.")
    pdf.body("Si haces un cambio nuevo después de deshacer, Rehacer se deshabilita (la pila de rehacer se vacía).")

    pdf.add_page()
    pdf.section("3. Cola FIFO — pagos programados")
    pdf.italic("El primero en la cola (vence antes) sale primero. Inicio → Pagos programados.")
    pdf.step("1", "Abre esa pestaña. El de vencimiento más próximo debe decir Frente de la cola; los demás Turno 2, Turno 3, etc.")
    pdf.step("2", "Pulsa Atender siguiente.")
    pdf.step("3", "El frente sale de la lista; el que era turno 2 pasa a ser el frente.")
    pdf.step("4", "Atiende otra vez: sale el nuevo frente, no uno de más atrás.")
    pdf.body("No puedes atender el de vencimiento 20 antes que el de vencimiento 5 si ambos siguen en cola.")

    pdf.section("4. Árbol binario — ranking de metas")
    pdf.italic("Insertar, buscar, inorden / preorden / postorden. Pestaña Metas.")
    pdf.step("1", "Revisa Nodos BST y Altura BST (deben ser mayores que 0 si hay metas).")
    pdf.step("2", "Pestaña Inorden: las metas van de menor a mayor monto objetivo.")
    pdf.step("3", "Preorden y Postorden: el orden cambia respecto al inorden.")
    pdf.step("4", "En el buscador escribe un monto objetivo exacto (ej. 5000) o parte del nombre: debe marcar la meta.")
    pdf.step("5", "Crea una meta con un monto intermedio (ej. 3000 si tenías 1000 y 5000).")
    pdf.step("6", "Vuelve a Inorden: la nueva queda en medio, no al final de un array suelto.")

    pdf.section("5. Tabla hash — índice de cuentas")
    pdf.italic("Búsqueda por clave y colisiones por encadenamiento. Pestaña Cuentas.")
    pdf.step("1", "En Índice hash de cuentas verás cubetas, claves y cubetas con colisión.")
    pdf.step("2", "Crea 3 o 4 cuentas si hace falta. Con 8 cubetas es normal que suban las colisiones.")
    pdf.step("3", "Toca una cuenta. En el detalle: Cuenta obtenida por clave hash (cubeta N).")
    pdf.step("4", "Si el id no existiera, verías que no se encontró la cuenta (el get no halló la clave).")
    pdf.body("La lista se arma desde los valores de la tabla; el detalle es get(id), no un find sobre un array.")

    pdf.add_page()
    pdf.section("6. Grafo — red de categorías")
    pdf.italic("Adyacencia + BFS y DFS. Funcionalidad aparte: no está en Inicio, Metas ni Cuentas.")
    pdf.step("1", "Engranaje de Inicio → Configuración → Red de categorías → Abrir.")
    pdf.step("2", "Elige una categoría (ej. Supermercado). Abajo salen sus vecinos.")
    pdf.step("3", "Recorrer BFS: orden por niveles (primero las pegadas, luego las más lejanas).")
    pdf.step("4", "Recorrer DFS: otro orden (profundiza por una rama).")
    pdf.step("5", "Cambia el origen (ej. Salario) y vuelve a BFS/DFS: cambia el recorrido.")
    pdf.step("6", "Compara BFS vs DFS desde el mismo origen: las listas no coinciden en general.")

    pdf.section("Guion de defensa (~8 minutos)")
    pdf.step("1", "+ crear gasto → Inicio lo muestra (lista: insertar + recorrer).")
    pdf.step("2", "Tocarlo → editar (buscar). Opcional: eliminar y que desaparezca.")
    pdf.step("3", "Deshacer / Rehacer (pila LIFO).")
    pdf.step("4", "Pagos programados → Atender siguiente dos veces (cola FIFO).")
    pdf.step("5", "Metas → Inorden vs Preorden vs buscar monto (árbol).")
    pdf.step("6", "Cuentas → cubetas/colisiones → abrir detalle (hash).")
    pdf.step("7", "Configuración → Red de categorías → BFS y DFS (grafo).")
    pdf.body('Si preguntan por el Stack de React Navigation: no cuenta. La pila de dominio son Deshacer y Rehacer en Inicio.')

    pdf.ln(4)
    pdf.set_fill_color(241, 246, 248)
    pdf.set_draw_color(*pdf.teal)
    y = pdf.get_y()
    pdf.rect(16, y, 184, 28, "FD")
    pdf.set_xy(22, y + 5)
    pdf.set_font("Body", "B", 12)
    pdf.set_text_color(*pdf.navy)
    pdf.cell(0, 6, "Mapa rápido")
    pdf.set_xy(22, y + 13)
    pdf.set_font("Body", "", 10.5)
    pdf.set_text_color(50, 58, 68)
    pdf.multi_cell(
        172,
        5.2,
        "Lista = movimientos  ·  Pila = deshacer  ·  Cola = pagos  ·  Árbol = metas  ·  Hash = cuentas  ·  Grafo = categorías",
    )

    pdf.output(str(OUTPUT))
    print(OUTPUT)


if __name__ == "__main__":
    build()
