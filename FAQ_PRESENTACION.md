# Preguntas frecuentes para la presentación del proyecto

## Control de Gastos — Expo + React Native + TypeScript

Este documento prepara respuestas para las preguntas que un docente suele hacer durante la defensa o demostración del proyecto. Está basado en la implementación real del código.

---

## 1. Preguntas generales sobre el proyecto

### ¿De qué trata la aplicación?

Es una aplicación móvil de **control de gastos personales** llamada **Control de Gastos**. Permite al usuario:

- Autenticarse con correo/contraseña o Google
- Registrar y consultar **movimientos financieros** (gastos e ingresos)
- Gestionar **cuentas** (bancarias, tarjetas de crédito, efectivo)
- Definir y dar seguimiento a **metas de ahorro**
- Ver **estadísticas** y gráficos de gastos por mes
- Configurar **tema claro/oscuro** y foto de perfil

### ¿Por qué eligieron Expo en lugar de React Native CLI puro?

Expo simplifica el desarrollo multiplataforma (Android, iOS y web) sin configurar Xcode o Android Studio desde cero. Ofrece:

- Un punto de entrada estándar (`expo/AppEntry.js`)
- Plugins listos (`expo-image-picker`, `expo-web-browser` para OAuth)
- Metro como bundler
- Comandos simples: `expo start`, `expo start --android`, etc.

El proyecto usa **Expo SDK 54** con **React Native 0.81** y **React 19**.

### ¿La app funciona en web, Android e iOS?

Sí, está configurada para las tres plataformas. En `package.json` hay scripts para `android`, `ios` y `web`. La autenticación con Google usa `expo-web-browser`, pensada para entornos móviles con deep linking (`controldegastos://`).

### ¿Cuál es el punto de entrada de la aplicación?

- **Entrada oficial de Expo:** `package.json` → `"main": "node_modules/expo/AppEntry.js"`
- **Componente raíz:** `App.tsx` en la raíz del proyecto
- Dentro de `App.tsx` se montan los providers globales y el navegador

`src/index.ts` es un archivo de **exportaciones** (barrel), no el entry point de la app.

---

## 2. Arquitectura y estructura del proyecto

### ¿Cómo está organizada la carpeta `src/`?

```
src/
├── components/     → Componentes reutilizables (UI y de negocio)
├── constants/      → Temas, colores, datos de referencia
├── context/        → AuthContext y ThemeContext
├── hooks/          → Hooks personalizados (useAppSettings)
├── navigation/     → Stack y Tabs navigators
├── screens/        → Pantallas por módulo funcional
├── services/       → Supabase client y AsyncStorage
├── store/          → Redux (finance + ui)
├── types/          → Tipos TypeScript (navegación, imágenes)
└── utils/          → Validación, fechas, moneda, estadísticas
```

Esta separación facilita:

- Encontrar código por responsabilidad
- Reutilizar componentes
- Mantener la lógica de negocio separada de la UI

### ¿Cuál es el flujo de arranque de la app?

```
App.tsx
  └── Redux Provider
        └── SafeAreaProvider
              └── ThemeProvider
                    └── AuthProvider
                          └── AppBootstrap (pantalla de carga)
                                └── AppNavigator
```

1. **Redux** provee estado global de datos financieros
2. **ThemeProvider** carga el tema guardado en AsyncStorage
3. **AuthProvider** restaura la sesión de Supabase con `getSession()`
4. **AppBootstrap** muestra un `ActivityIndicator` hasta que auth y tema estén listos
5. **AppNavigator** decide si abrir `Login` o `MainTabs` según si hay sesión

### ¿Por qué usan varias capas de estado (Context + Redux + useState)?

Porque cada herramienta resuelve un problema distinto:

| Herramienta | Uso en el proyecto |
|-------------|-------------------|
| `useState` | Estado local de formularios, errores, loading en pantallas |
| **Context API** | Autenticación y tema (estado global de sesión y apariencia) |
| **Redux Toolkit** | Datos de negocio: cuentas, movimientos, metas, UI de tabs/mes |

Esto cumple el criterio académico de demostrar **estado local, contexto global y Redux** sin mezclar responsabilidades.

---

## 3. TypeScript y tipado

### ¿Por qué usaron TypeScript?

Para tener **tipado estático**, detectar errores en tiempo de desarrollo y documentar contratos entre componentes. Ejemplos:

- Props tipadas en `CustomButton`, `CustomInput`, `Button`
- `RootStackParamList` y `MainTabParamList` para navegación type-safe
- Tipos de dominio: `Account`, `MovementItem`, `SavingsMeta`

### ¿Dónde se tipa la navegación?

En `src/types/navigation.ts`:

```typescript
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  Configuracion: undefined;
  RegistroMovimiento: { movimientoId?: string } | undefined;
  Register: undefined;
  CuentasDetalle: { accountId: string };
  NuevaCuenta: undefined;
  MetaForm: { metaId?: string } | undefined;
};
```

Esto permite que `navigation.navigate('CuentasDetalle', { accountId: '...' })` valide parámetros en compile-time.

### ¿El proyecto usa `strict: true`?

Sí, en `tsconfig.json` está activado el modo estricto de TypeScript.

---

## 4. Componentes y UI

### ¿Qué componentes nativos de React Native usan?

Entre los más usados:

- `View`, `Text`, `ScrollView`, `TextInput`
- `Pressable`, `TouchableOpacity`
- `Image`, `ActivityIndicator`
- `KeyboardAvoidingView`, `SafeAreaView`
- `StyleSheet` para estilos

### ¿Qué componentes personalizados reutilizables crearon?

**Capa de negocio/UI compuesta:**

- `CustomButton`, `CustomInput`
- `ScreenHeader`, `StatCard`, `GoalCard`
- `FloatingTabBar`, `FloatingAddButton`
- `SpendingChart`, `AccountsDonutChart`
- `AccountListItem`, `MetaListItem`, `InstallmentCard`

**Capa UI base (`src/components/ui/`):**

- `Button`, `Text`, `Card`, `Switch`, `Badge`, `Tabs`

Todos reciben **props tipadas** con TypeScript.

### ¿Cómo reutilizan estilos según el tema?

Los componentes consumen colores dinámicos vía `useAppSettings()` o `useTheme()`, que devuelve `colors` según el modo claro u oscuro definido en `src/constants/themes.ts`.

Ejemplo: `CustomButton` genera estilos con `useMemo` dependiendo de `colors` y `variant`.

### ¿Qué es `useAppSettings()`?

Es un **hook de compatibilidad** que combina:

- `useTheme()` → tema y colores
- `useAuth()` → email del usuario y foto de perfil

Así los componentes que ya usaban `useAppSettings` siguen funcionando sin duplicar lógica.

---

## 5. Estilización y Flexbox

### ¿Cómo aplican estilos?

Con `StyleSheet.create()` de React Native. No usan CSS tradicional en las pantallas móviles (aunque existen restos de CRA en archivos `.css` que no son parte del flujo Expo principal).

### ¿Dónde usan Flexbox?

En prácticamente todos los layouts. Ejemplos típicos:

| Propiedad | Uso |
|-----------|-----|
| `flex: 1` | Pantallas que ocupan todo el espacio |
| `flexDirection: 'row'` | Filas de icono + input, filas de configuración |
| `alignItems: 'center'` | Centrar verticalmente |
| `justifyContent: 'center'` | Centrar horizontalmente, login centrado |
| `gap` | Espaciado entre elementos del formulario |

### ¿Cómo funciona el tema claro/oscuro?

1. `ThemeContext` guarda `theme: 'light' | 'dark'`
2. Al cambiar, persiste en AsyncStorage (`@app_theme`)
3. Selecciona `lightColors` o `darkColors` de `themes.ts`
4. Los componentes leen `colors.background`, `colors.foreground`, etc.
5. El switch está en **Configuración** con el componente `Switch` personalizado

### ¿Por qué no usaron una librería de UI completa (NativeBase, Paper)?

Para demostrar dominio de componentes nativos, Flexbox y creación de componentes propios, que es parte del objetivo del curso.

---

## 6. Navegación (React Navigation)

### ¿Qué tipos de navegación implementaron?

Dos niveles:

1. **Stack Navigator** (`AppNavigator.tsx`)
   - Login, Register, MainTabs
   - Pantallas modales/de detalle: Configuración, RegistroMovimiento, CuentasDetalle, NuevaCuenta, MetaForm

2. **Bottom Tab Navigator** (`MainTabNavigator.tsx`)
   - Metas, Inicio, Cuentas
   - Tab bar personalizado: `FloatingTabBar`

### ¿Cuál es el flujo de navegación principal?

```
[No autenticado]
Login ↔ Register
   ↓ (login exitoso)
MainTabs (Inicio | Metas | Cuentas)
   ↓
Stack screens: Configuración, Nuevo movimiento, Detalle cuenta, Nueva cuenta, Form meta
```

### ¿Cómo navegan al registrar un movimiento?

Desde cualquier tab hay un `FloatingAddButton` que hace:

`navigation.navigate('RegistroMovimiento')`

### ¿Cómo pasan parámetros entre pantallas?

Con el stack tipado. Ejemplo:

- `CuentasDetalle` recibe `{ accountId: string }`
- `RegistroMovimiento` puede recibir `{ movimientoId?: string }` para editar
- `MetaForm` puede recibir `{ metaId?: string }` para editar una meta

### ¿Por qué `initialRouteName` depende de `isAuthenticated`?

Para que si el usuario ya tiene sesión activa en Supabase, la app **no lo mande al Login** cada vez que la abre. Se evalúa en `AppNavigator` después de que `AuthProvider` termina de cargar.

### ¿Cómo manejan el logout a nivel de navegación?

En Configuración, tras `signOut()`, usan:

```typescript
CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] })
```

Esto limpia el historial de navegación y evita que el usuario pueda volver atrás a pantallas protegidas.

---

## 7. Manejo de estado

### ¿Qué estado es local (`useState`)?

Estado que solo le importa a una pantalla o componente:

- Valores de formularios (email, contraseña, nombre, monto)
- Errores de validación
- Flags de loading (`loadingGoogle`, `loading`)
- UI temporal (mostrar/ocultar contraseña en `CustomInput`)

### ¿Qué hace el AuthContext?

Centraliza toda la autenticación:

| Expone | Descripción |
|--------|-------------|
| `user`, `session` | Usuario y sesión de Supabase |
| `isAuthenticated` | `true` si hay sesión activa |
| `isLoading` | `true` mientras restaura sesión inicial |
| `profileImageUri` | URL/local de la foto de perfil |
| `signInWithPassword` | Login email/contraseña |
| `signUp` | Registro con metadata (nombre, teléfono) |
| `signInWithGoogle` | OAuth con deep link |
| `signOut` | Cerrar sesión y limpiar datos locales |

**Inicialización:**

1. `supabase.auth.getSession()` al montar
2. `onAuthStateChange` para reaccionar a login/logout/refresh

### ¿Qué hace el ThemeContext?

- Carga tema desde AsyncStorage al iniciar
- Expone `theme`, `colors`, `isDark`, `setTheme`, `toggleTheme`
- Marca `isReady` cuando terminó de cargar

### ¿Qué guardan en Redux?

**`financeSlice`:**

- Cuentas (`accounts`)
- Movimientos (`movimientos`)
- Metas de ahorro (`savingsMetas`)
- Thunks async que llaman a Supabase

**`uiSlice`:**

- Tab activo en pantalla Inicio (`inicioActiveTab`)
- Mes seleccionado para estadísticas (`inicioSelectedMonthKey`)

### ¿Por qué Redux para finanzas y no Context?

Porque los datos financieros:

- Son muchos y cambian con frecuencia
- Vienen de operaciones async (thunks)
- Se consultan desde varias pantallas
- Se benefician de selectores (`financeSelectors`, `uiSelectors`)

Redux Toolkit con `createAsyncThunk` es adecuado para este patrón CRUD + sincronización con backend.

### ¿Cómo conectan Redux con los componentes?

Con hooks tipados en `src/store/hooks.ts`:

- `useAppDispatch()`
- `useAppSelector()`

Ejemplo en `InicioScreen`:

```typescript
const movimientos = useAppSelector(selectMovimientosByMonth(selectedMonthKey));
dispatch(fetchMovimientosByMonthThunk(selectedMonthKey));
```

---

## 8. Supabase — autenticación y datos

### ¿Qué es Supabase y por qué lo usaron?

Supabase es un backend-as-a-service basado en PostgreSQL que ofrece:

- **Auth** (email, OAuth)
- **Base de datos** con API REST
- **Storage** para archivos

Permite conectar la app móvil a datos reales en la nube sin montar un servidor propio.

### ¿Cómo configuran el cliente?

En `src/services/supabaseClient.ts`:

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Las variables van en `.env` con prefijo `EXPO_PUBLIC_` para que Expo las exponga al cliente.

### ¿Qué métodos de autenticación soportan?

| Método | Implementación |
|--------|----------------|
| Email + contraseña | `supabase.auth.signInWithPassword` |
| Registro | `supabase.auth.signUp` con metadata (`full_name`, `phone_number`) |
| Google OAuth | `signInWithOAuth` + `expo-web-browser` + `setSession` con tokens |
| Cerrar sesión | `supabase.auth.signOut` |

### ¿Cómo funciona el login con Google?

1. Se pide URL de OAuth a Supabase con `redirectTo: controldegastos://auth/v1/callback`
2. Se abre el navegador in-app con `WebBrowser.openAuthSessionAsync`
3. Google redirige al deep link de la app
4. Se extraen `access_token` y `refresh_token` de la URL
5. Se llama `supabase.auth.setSession()` para establecer la sesión

El scheme `controldegastos` está definido en `app.json`.

### ¿Qué tablas usan en la base de datos?

| Tabla | Uso |
|-------|-----|
| `cuentas` | Cuentas del usuario (banco, tarjeta, efectivo) |
| `movimientos` | Gastos e ingresos |
| `ahorros_metas` | Metas de ahorro |

Todas filtran por `user_id` del usuario autenticado.

### ¿Qué operaciones CRUD hacen con Supabase?

**Cuentas:** fetch, create  
**Movimientos:** fetch por mes, fetch por cuenta, create, update  
**Metas:** fetch, create, update  
**Storage:** subida de avatar al bucket `avatars`

Los thunks están en `financeSlice.ts`: `fetchAccountsThunk`, `createNewAccountThunk`, `addMovimientoThunk`, `updateMovimientoThunk`, `fetchSavingsMetasThunk`, etc.

### ¿Cómo aseguran que cada usuario solo vea sus datos?

En cada thunk se obtiene el usuario actual:

```typescript
const { data: userData } = await supabase.auth.getUser();
```

Y las consultas usan `.eq('user_id', userData.user.id)`.

En producción esto debería complementarse con **Row Level Security (RLS)** en Supabase.

### ¿Usan Supabase Storage?

Sí. En Configuración, la foto de perfil se sube al bucket `avatars` en la ruta `{userId}/avatar.{ext}`. Si falla la subida, se guarda localmente como respaldo.

---

## 9. Validación y reglas de negocio

### ¿Dónde validan los formularios?

En `src/utils/validation.ts` y en cada pantalla antes de enviar.

**Login/Registro:**

- Campo obligatorio (`isRequired`)
- Email válido (`isValidEmail`)
- Dominios permitidos: `@gmail.com`, `@unitec.edu`, `@hotmail.com`, `@outlook.com`
- Contraseña > 8 caracteres (`isValidPassword`)

**Movimientos:**

- Monto válido (`isValidAmount`)
- Fecha en formato DD/MM/YYYY (`isValidDate`)
- Día de vencimiento 1–31 (`isValidDueDay`)

### ¿Por qué restringen dominios de correo?

Es una regla de negocio del proyecto (probablemente para el contexto académico con correos `@unitec.edu` y proveedores comunes). Se puede justificar como validación de entrada adicional.

---

## 10. Funcionalidades por pantalla (para la demo)

### Login

- Email y contraseña con validación
- Botón Google
- Enlace a registro

### Register

- Nombre, teléfono, email, contraseña
- Registro con Supabase
- Registro/login con Google

### Inicio (tab principal)

- Estadísticas del mes (gastos, ingresos, balance)
- Gráfico de gastos (`SpendingChart`)
- Selector de mes (`MonthSelector`)
- Tabs: movimientos vs pagos programados
- Navegación a configuración

### Metas

- Lista de metas de ahorro desde Supabase
- Formulario para crear/editar meta (`MetaForm`)

### Cuentas

- Lista de cuentas del usuario
- Gráfico donut de distribución
- Detalle por cuenta (`CuentasDetalle`)
- Crear cuenta nueva (`NuevaCuenta`)

### Registro de movimiento

- Formulario para gasto/ingreso
- Categorías, cuenta bancaria, monto, fecha
- Crear o editar movimiento existente

### Configuración

- Foto de perfil (galería + subida a Supabase)
- Toggle tema oscuro
- Cerrar sesión

---

## 11. Preguntas técnicas que el docente podría hacer

### ¿Cuál es la diferencia entre Context y Redux en su proyecto?

**Context** → estado global **transversal** que muchos componentes necesitan leer pero que cambia con poca frecuencia:

- ¿Está logueado el usuario?
- ¿Qué tema visual usar?

**Redux** → estado de **dominio de la aplicación** con lógica async y muchas actualizaciones:

- Lista de movimientos
- Cuentas
- Metas

### ¿Por qué no pusieron todo en Redux?

Porque el criterio pide demostrar **Context API** para auth y tema. Además, mezclar sesión de usuario con 50 movimientos en el mismo store complica el mantenimiento.

### ¿Por qué no pusieron todo en Context?

Porque Context sin optimización puede causar **re-renders innecesarios** en toda la app cuando cambia cualquier valor. Redux + selectores es más eficiente para listas y datos que cambian a menudo.

### ¿Qué es un thunk en Redux?

Una función async que despacha acciones. Ejemplo: `fetchAccountsThunk` llama a Supabase y luego actualiza el estado con `fulfilled` o `rejected`.

### ¿Qué pasa si no hay internet?

- La UI seguirá mostrando lo último en Redux (si ya se cargó)
- Las operaciones nuevas fallarán al llamar Supabase
- La sesión puede seguir existiendo localmente hasta que expire el token

### ¿Dónde persisten datos localmente?

Con **AsyncStorage**:

- Tema (`@app_theme`)
- Email (`@user_email`)
- Foto de perfil (`@profile_image`)

La sesión de Supabase también se persiste internamente en el cliente.

### ¿Qué es `AppBootstrap`?

Un componente que **bloquea la UI** con un loading hasta que:

- `AuthContext` termine de verificar sesión
- `ThemeContext` termine de cargar el tema

Evita un "flash" de pantalla incorrecta (ej. Login cuando ya hay sesión).

### ¿Qué es un deep link y para qué lo usan?

Un enlace que abre la app directamente (`controldegastos://...`). Se usa para que Google OAuth redirija de vuelta a la app después de autenticar.

### ¿Qué librerías de gráficos usan?

`react-native-svg` para gráficos personalizados (`SpendingChart`, `AccountsDonutChart`).

### ¿Usan íconos de dónde?

`@expo/vector-icons` (Ionicons, MaterialIcons) y `lucide-react-native`.

---

## 12. Seguridad (preguntas probables)

### ¿Es seguro guardar la anon key de Supabase en el cliente?

La **anon key** está diseñada para estar en el cliente. La seguridad real depende de las **políticas RLS** en Supabase, no de ocultar la key.

### ¿Las contraseñas se guardan en la app?

No. Supabase Auth las maneja en el servidor. La app solo las envía en el login/registro.

### ¿El `.env` debe subirse a GitHub?

**No.** Debe estar en `.gitignore`. Solo se comparten las variables de forma privada.

### ¿Validan en cliente y servidor?

Validación en **cliente** sí (UX inmediata). La validación en **servidor** depende de RLS y constraints en Supabase; conviene mencionar que en producción se reforzaría con políticas RLS.

---

## 13. Preguntas sobre decisiones y limitaciones (honestas)

### ¿Qué mejorarían en una versión 2?

- Políticas RLS documentadas y probadas en Supabase
- Pantallas de error globales y manejo offline
- Eliminar archivos residuales de Create React App (`src/index.tsx`, `.css`)
- Tests unitarios para validación y thunks
- Refresh automático de listas tras crear/editar sin depender solo de `useFocusEffect`

### ¿Hay datos mock todavía en el proyecto?

`sampleData.ts` define tipos y algunos datos de referencia (categorías, tipos de cuenta). Los datos principales de cuentas, movimientos y metas vienen de **Supabase** vía thunks.

### ¿La app soporta recuperación de contraseña?

Actualmente **no** hay pantalla de "olvidé mi contraseña". Se puede mencionar como mejora futura con `supabase.auth.resetPasswordForEmail`.

### ¿Por qué algunos componentes usan `useAppSettings` y otros podrían usar `useTheme` directamente?

`useAppSettings` es una capa de compatibilidad para no refactorizar todos los componentes. Los contexts nuevos (`useAuth`, `useTheme`) son la fuente real del estado.

---

## 14. Guion rápido para la demostración (5–10 min)

1. **Abrir app** → mostrar que restaura sesión o pide login
2. **Login** → mostrar validación de campos
3. **Inicio** → estadísticas, gráfico, cambiar mes
4. **Botón +** → registrar un movimiento
5. **Cuentas** → ver lista, entrar a detalle, crear cuenta
6. **Metas** → ver/crear meta de ahorro
7. **Configuración** → cambiar tema oscuro, foto de perfil
8. **Cerrar sesión** → volver a Login

---

## 15. Respuestas cortas "de bolsillo"

| Pregunta | Respuesta corta |
|----------|-----------------|
| ¿Stack o tabs? | Ambos: Stack para auth y detalle, Tabs para módulos principales |
| ¿Estado global? | Context para auth/tema, Redux para datos financieros |
| ¿Backend? | Supabase (PostgreSQL + Auth + Storage) |
| ¿TypeScript? | Sí, strict mode, props y navegación tipadas |
| ¿Componentes reutilizables? | Sí, carpeta `components/` y `components/ui/` |
| ¿Flexbox? | Sí, en todos los layouts con StyleSheet |
| ¿Persistencia? | AsyncStorage + sesión Supabase |
| ¿Entry point? | `App.tsx` vía Expo AppEntry |

---

## 16. Cierre sugerido para la presentación oral

> "Control de Gastos es una aplicación móvil desarrollada con Expo, React Native y TypeScript. Usamos React Navigation con Stack y Tabs para organizar el flujo, Context API para autenticación y tema, y Redux Toolkit para los datos financieros sincronizados con Supabase. La arquitectura separa responsabilidades: la UI consume hooks y contexts, la navegación está tipada, y las operaciones de datos pasan por thunks async conectados a PostgreSQL en la nube. El objetivo es ofrecer al usuario una herramienta real para registrar gastos, administrar cuentas y cumplir metas de ahorro desde el móvil."
