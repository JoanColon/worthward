# Worthward

Worthward es un workspace de finanzas personales, mobile-first, para comprender patrimonio neto,
Cost of Life, capacidad de ahorro y progreso hacia objetivos financieros. Permite trabajar de forma
individual o compartir un workspace manteniendo ownership por miembro.

Este README es la entrada al repositorio. Los contratos y decisiones detallados viven en `docs/`;
el código, Firestore Rules y los tests determinan el comportamiento implementado.

## Capacidades actuales

- autenticación con email/contraseña y Google;
- workspaces personales y compartidos mediante invitaciones de un solo uso;
- activos, pasivos, ingresos y gastos con ownership porcentual;
- proyección anual materializada en `financialYears`;
- Expense Tracker y reconciliación con el modelo estimado;
- historial, Progress y milestones;
- modelos de Cash, inmueble e hipoteca;
- portfolios sincronizados desde Google Sheets mediante un enlace accesible;
- What If gratuito y Strategy Pro;
- aplicación web y Android mediante Capacitor;
- suscripción anual de Google Play y trial promocional gestionado por Worthward;
- workspace demo compartido y de solo lectura.

La interfaz está actualmente en inglés. La aplicación usa EUR como moneda inicial, permite cambiar
el código mostrado y no convierte divisas.

## Stack

| Área               | Implementación                                          |
| ------------------ | ------------------------------------------------------- |
| UI                 | Vue 3 Composition API y Quasar 2                        |
| Estado             | Pinia 4                                                 |
| Navegación         | Vue Router, rutas explícitas y modo hash                |
| Backend            | Firebase Authentication, Firestore y Cloud Functions v2 |
| Dominio compartido | JavaScript ES Modules en `functions/shared/`            |
| Gráficos           | ECharts 6                                               |
| Traducciones       | Vue I18n                                                |
| Tests              | Vitest y Firebase Rules Unit Testing                    |
| Calidad            | ESLint y Prettier                                       |
| Android            | Capacitor 8, API 36, package `com.worthward.app`        |
| Región Firebase    | `europe-west1`                                          |

## Puesta en marcha

Requisitos principales:

- Node.js `^22.12`, `^24` o `>=26`; Functions se despliega con Node 24;
- Yarn Classic para la instalación de la SPA y Capacitor;
- npm para `functions/`;
- Firebase CLI para emuladores y despliegues;
- Java 21, Android Studio y Android SDK 36 para Android.

Instalación:

```bash
yarn install --frozen-lockfile
yarn --cwd src-capacitor install --frozen-lockfile
npm --prefix functions ci
yarn dev
```

La raíz conserva `yarn.lock` y `package-lock.json`. Hasta resolver esa duplicidad, no regeneres
lockfiles ni cambies de gestor dentro de una tarea no relacionada.

### Comandos habituales

| Comando                                       | Efecto                                             |
| --------------------------------------------- | -------------------------------------------------- |
| `npm run dev`                                 | Arranca la SPA con Quasar/Vite.                    |
| `npm test`                                    | Ejecuta la suite Vitest.                           |
| `npm run test:rules`                          | Ejecuta los tests de Firestore Rules con emulador. |
| `npm run lint:check`                          | Comprueba Prettier y ESLint sin reescribir.        |
| `npm run build`                               | Genera la SPA en `dist/spa`.                       |
| `npm run emulators:start`                     | Arranca Auth, Firestore y Functions locales.       |
| `npm run emulators:seed-demo -- --input PATH` | Carga un fixture demo en el emulador.              |
| `npm run dev:emulators`                       | Arranca la SPA conectada a los emuladores.         |
| `npm run android:dev`                         | Abre Android con HMR mediante Capacitor.           |
| `npm run android:sync`                        | Sincroniza plugins y assets de Capacitor.          |
| `npm run android:build`                       | Compila una release Android.                       |
| `npm run android:bundle`                      | Genera el Android App Bundle.                      |

`npm run lint` aplica formato y autofix: es mutante y no debe usarse como verificación.

Consulta [desarrollo local](docs/operations/DEVELOPMENT.md),
[despliegue](docs/operations/DEPLOYMENT.md) y [operación del demo](docs/operations/DEMO.md) para los
procedimientos completos.

## Organización

```text
src/                    SPA: pages, componentes, stores, servicios y dominio cliente
functions/features/     Callables, triggers, schedules y servicios privilegiados
functions/shared/       Motor financiero portable y capacidades compartidas
test/                   Tests de dominio, stores, servicios, Functions y Rules
landing/                Landing estática, con configuración y build propios
src-capacitor/           Wrapper y proyecto Android
docs/                   Contratos, decisiones, operaciones, planes e historia
references/             Referencias externas de solo lectura
firestore.rules          Autorización de clientes
firestore.indexes.json   Índices Firestore
firebase.json            Hosting, Functions, Firestore y emuladores
```

La dirección habitual de dependencias es:

```text
page/component -> store -> service -> Firebase
                         \
                          -> domain/functions/shared (lógica pura)
```

Las mutaciones del modelo financiero pasan por `mutateFinancialModel` para actualizar de forma
atómica el documento fuente y su proyección anual. What If, Strategy, achievements y Expense Tracker
tienen fronteras de persistencia específicas descritas en la documentación técnica.

## Documentación

| Necesidad                                    | Referencia                                      |
| -------------------------------------------- | ----------------------------------------------- |
| Visión, módulos y política funcional         | [PRODUCT.md](docs/PRODUCT.md)                   |
| Capas, flujos y mapa del código              | [ARCHITECTURE.md](docs/ARCHITECTURE.md)         |
| Colecciones, contratos e IDs                 | [DATA_MODEL.md](docs/DATA_MODEL.md)             |
| Fórmulas e invariantes financieras           | [FINANCIAL_ENGINE.md](docs/FINANCIAL_ENGINE.md) |
| Autenticación, demo, Free/Pro y autorización | [ACCESS_CONTROL.md](docs/ACCESS_CONTROL.md)     |
| Tokens y componentes de interfaz             | [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)       |
| Estrategia y matriz de validación            | [TESTING.md](docs/TESTING.md)                   |
| Decisiones aceptadas y pendientes            | [DECISIONS.md](docs/DECISIONS.md)               |
| Desarrollo, despliegue, demo y marca         | [operations/](docs/operations/)                 |
| Planes persistentes                          | [plans/README.md](docs/plans/README.md)         |
| Evidencia no normativa                       | [archive/](docs/archive/)                       |

`functions/shared/README.md` documenta el contrato local del motor portable y `landing/README.md` el
subproyecto de la landing.

## Contribución

Antes de modificar una zona, consulta [AGENTS.md](AGENTS.md) y solo los documentos relacionados con
la tarea. Mantén los cambios dentro del alcance, preserva datos e identificadores existentes y
actualiza la documentación canónica si cambia un contrato.

Como validación transversal de referencia:

```bash
npm run lint:check
npm test
npm run build
```

Añade tests de Rules, emuladores y comprobaciones manuales responsive cuando el cambio lo requiera.
No hagas deploys ni operaciones sobre producción sin autorización explícita.
