# Arquitectura

## Alcance

Referencia de la arquitectura implementada. Los contratos persistidos están en
[DATA_MODEL.md](DATA_MODEL.md), las fórmulas en [FINANCIAL_ENGINE.md](FINANCIAL_ENGINE.md) y la
autorización en [ACCESS_CONTROL.md](ACCESS_CONTROL.md).

## Vista general

```text
Vue page/component
        |
        v
Pinia store / composable
        |
        v
Firebase service -----------------> Auth / Firestore / callable
        |                                      |
        v                                      v
src/domain                       functions/features
        \                            /
         +---- functions/shared ----+
```

La SPA, Functions y dominio compartido usan JavaScript ES Modules. `@` resuelve a `src/`.

## Responsabilidades

- **Pages:** ensamblan rutas y coordinan stores; no deberían contener cálculos financieros puros.
- **Components:** encapsulan presentación e interacción local, sin conocer el esquema completo de
  Firestore.
- **Composables:** comportamiento Vue reutilizable sin asumir persistencia global.
- **Stores:** caché, loading/error, listeners y coordinación de servicios.
- **Services:** traducen operaciones de aplicación a Auth, Firestore o callables.
- **Domain:** cálculos deterministas y validación sin Vue ni acceso remoto.
- **Config:** IDs estables, categorías, temas y definiciones compartidas por la UI.
- **Functions features:** límites privilegiados, integración externa, triggers y schedules.
- **Functions shared:** dominio portable sin Firebase, Vue, estado remoto ni IDs de workspace.

`functions/shared/README.md` contiene el contrato local de ese motor.

## Estado y sesión

`services/auth.js` observa Firebase Auth. El router espera a que la sesión se resuelva antes de
proteger `/home`; un redirect local seguro permite regresar a la ruta solicitada.

`AppLayout` coordina el workspace activo, stores y gates de ruta. Los stores de modelo cachean por
workspace/categoría y exponen `reset()`. `financial-years-store` mantiene una suscripción en tiempo
real al workspace/año activo. Cambiar de workspace debe rebindear o limpiar todo estado dependiente.

## Lecturas y escrituras

### Modelo financiero

Assets, liabilities, income y expenses se leen desde colecciones `model*`. Sus mutaciones pasan por
la callable `mutateFinancialModel`, que valida membership/capacidad y actualiza atómicamente el
documento fuente y el año financiero afectado.

### Proyección anual

`ensureFinancialYear` crea o asegura únicamente el año actual. Triggers reconstruyen secciones
afectadas por configuración y tracking. El schedule mensual cierra posiciones observadas. Los
clientes solo leen `financialYears`.

### Escrituras directas controladas por Rules

- `expenseTracking`: miembros de un workspace activo;
- `modelConfig/whatIf`: miembros, incluido Free;
- `modelConfig/whatIfStrategies`: miembros con entitlement Pro vigente;
- `achievements` y `milestoneTracking`: miembros de un workspace activo;
- preferencias del usuario: exclusivamente el propio usuario y campos permitidos.

### Operaciones privilegiadas

Workspaces, invitaciones, borrado recursivo, billing, trial, portfolio externo y mutaciones del
modelo usan callables/Admin SDK. Firestore Rules bloquea el acceso cliente a `workspaceInvites` y
`billingPurchases`.

## Backend

`functions/index.js` inicializa Admin SDK una vez y exporta:

- modelo: `mutateFinancialModel`;
- años: `ensureFinancialYear`, triggers y cierre mensual;
- workspaces: creación, configuración, invitaciones y borrado;
- cuenta: borrado de cuenta;
- billing: verificación y reconciliación de Google Play;
- trial: inicio y confirmación del aviso final;
- portfolios: lectura, actualización y sincronización.

Los wrappers callable convierten errores; la lógica testeable vive en `service.js`. Todas las
Functions usan `europe-west1` y las opciones globales limitan instancias salvo override local.

## Integraciones

- **Firebase Auth:** email/password, Google web y autenticación nativa de Capacitor.
- **Google Play:** compra Android validada en backend; el cliente no concede derechos.
- **Google Sheets/GViz:** lectura de portfolios desde una hoja accesible mediante enlace.
- **Firebase Hosting:** SPA en `dist/spa` y landing en `landing/dist` con targets separados.

## Navegación y localización de cambios

| Cambio                     | Punto de entrada                                                        |
| -------------------------- | ----------------------------------------------------------------------- |
| Vista o ruta               | `src/pages/`, `src/router/routes.js`                                    |
| Composición compartida     | `src/components/ui/`, `src/components/layout/`                          |
| Estado remoto              | `src/stores/`, `src/services/firebase/`                                 |
| Cálculo financiero         | `functions/shared/`, adaptador en `src/domain/financial/` si hace falta |
| Mutación fuente/proyección | `functions/features/financial-model/`                                   |
| Año e historia             | `functions/features/financial-years/`, `financial-years-store.js`       |
| Workspace y membership     | `functions/features/workspaces/`                                        |
| Billing o trial            | `functions/features/billing/`, `trials/`, `functions/shared/billing/`   |
| Portfolio                  | `functions/features/investment-portfolios/`                             |
| Autorización cliente       | `firestore.rules` y `test/security/`                                    |
| Categorías e IDs           | `src/config/` y definiciones compartidas relacionadas                   |

## Invariantes arquitectónicos

- La UI no es una frontera de seguridad.
- La lógica pura no depende de Firebase o Vue.
- Las mutaciones relacionadas que deben permanecer consistentes son atómicas en backend.
- Los resultados de simulaciones se recomputan; solo se persisten inputs.
- Los periodos cerrados y los IDs persistidos no se reinterpretan retroactivamente.
- El demo se protege en cliente, Rules y Admin SDK.
