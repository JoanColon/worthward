# Worthward — Product Vision

## Document status

This document describes the intended product direction, core domain rules, and
initial architectural boundaries for Worthward.

It is a product reference, not a claim that every feature described here is
already implemented. Sections marked as open decisions must be resolved before
their corresponding implementation phase begins.

---

## 1. Product vision

Worthward is a mobile-first personal-finance workspace built with Vue,
Quasar, Capacitor, TypeScript, Firebase Authentication, Cloud Firestore, and
Pinia.

It must not become another generic expense tracker. Its purpose is to help
people understand:

1. Their current financial position.
2. What their life actually costs.
3. Their realistic savings capacity.
4. How changes in income, expenses, or investments affect their future.
5. Their progress toward financial goals.
6. Their finances individually or together with other people.

The central promise is:

> Know your worth today. Find your way forward.

The product must remain useful even when users do not record every individual
expense. Its core learning loop is:

```text
Estimate → Track → Confirm → Learn
```

Users begin with reasonable estimates, optionally track real spending,
periodically confirm reality, and gradually improve the accuracy of their
financial model.

---

## 2. Product positioning

Worthward should be understood as a **Personal Finance Workspace**, not as
an expense tracker.

It is organized around four questions:

```text
Position       What do I own and owe?
Cost of Life   What does my life actually cost?
Capacity       What can I realistically save?
Future         Where will that take me?
```

The product narrative is:

```text
Financial Position
        ↓
Cost of Life
        ↓
Savings Capacity
        ↓
Plan
        ↓
What-if
        ↓
Future
        ↓
Progress
```

Expense tracking is only one mechanism for improving the underlying financial
model.

---

## 3. Core product principles

### 3.1 Do not require perfect tracking

The application must never assume:

```text
tracked expenses = real expenses
```

Tracking may be incomplete. The app must remain useful if a user stops
recording transactions for days or weeks.

### 3.2 Cost of Life is the central expense metric

The main expense question is not “How much did I spend this month?” but “How
much does my life actually cost?”

Conceptually:

```text
Annual fixed expenses
+ Annual periodic expenses
+ Projected variable expenses
= Annual Cost of Life
```

```text
Monthly Cost of Life = Annual Cost of Life / 12
```

This metric feeds Financial Position, Savings Capacity, planning, investment
scenarios, FIRE calculations, and progress.

Expense definitions are the single source of truth for Cost of Life. An
unrelated, manually maintained annual-expense total must not exist elsewhere.

### 3.3 Stored and derived data are different

Authoritative stored data includes:

- Assets and liabilities.
- Income sources.
- Expense definitions and transactions.
- Monthly expense summaries.
- Plan assumptions and saved scenarios.
- Historical snapshots.

Derived data includes:

- Net worth.
- Annual income.
- Annual fixed, periodic, and projected variable expenses.
- Annual and monthly Cost of Life.
- Savings capacity and savings rate.
- FIRE targets and portfolio projections.
- Scenario and sensitivity results.

Derived values must not be persisted as a second source of truth. Historical
snapshots are an intentional exception because they preserve past calculated
state.

For the current implementation, `financialYears` has two deliberate roles.
Previous years are closed history. The current year is the active annual model:
changing a base income or expense updates all twelve months, while the monthly
table stores explicit month-specific exceptions. Expense Tracker entries and
reconciliations remain separate period data and must stay consultable even when
the active model changes. Monthly asset and liability positions are closed in
the same annual document; a separate position-history collection must not be
maintained as a second source of truth.

### 3.4 Prevent financial double counting

The domain model must distinguish:

```text
Consumption
Transfer
Investment
```

Investing money is not a living expense. Moving cash into an investment changes
the composition of assets but does not reduce net worth or increase Cost of
Life.

A payment linked to an existing periodic expense confirms or records that
expense; it does not create a second Cost of Life item.

A liability balance affects net worth, while its payment affects cash flow and
may affect Cost of Life. These are related but different concepts.

---

## 4. Experience principles

The experience should feel:

- Clean, minimal, calm, and premium.
- Professional but consumer-oriented.
- Highly readable, with generous whitespace.
- Focused on large financial numbers and simple cards.
- Restrained in its use of color, borders, shadows, icons, and graphs.

Functional colors may include:

```text
green  → assets, positive values, savings
red    → liabilities
orange → expenses
blue   → navigation and neutral information
```

Avoid excessive gradients, corporate dashboards, many charts or badges,
gamification, oversized forms, overloaded screens, and accounting-style UX.

### 4.1 No traditional onboarding wizard

Do not create a long, mandatory onboarding sequence. Users should enter the
actual application immediately and be free to start anywhere.

An initial Financial Position may simply show zero values and contextual calls
to action for adding assets, liabilities, income, and Cost of Life information.
The picture becomes richer as data is added.

### 4.2 Primary navigation

The main bottom navigation should remain limited to:

1. Home / Financial Position.
2. Expenses.
3. Plan.
4. Progress.

Settings should live behind an avatar or toolbar action, not in the primary
navigation.

---

## 5. Financial Workspace

The primary ownership boundary is a `FinancialWorkspace`, not a user.

A user may belong to several workspaces, for example:

```text
My finances
Joan + Anna
Family finances
Rental property
Side business
```

The core model must not depend on rigid labels such as individual, couple, or
family. A workspace contains members. An optional `personal | shared` type may
help the interface, but it must not govern authorization or business logic.

Conceptual structure:

```text
users/{uid}

workspaces/{workspaceId}
workspaces/{workspaceId}/members/{uid}
```

The membership subcollection is the authorization source of truth. A cached
workspace list under the user may be used for discovery and performance, but
must never grant access.

### 5.1 Active workspace

The application always operates inside a `currentWorkspaceId`. All financial
queries and derived metrics must be scoped to it.

Changing workspace must rebind:

- Assets and liabilities.
- Income sources.
- Expense definitions and transactions.
- Monthly expense summaries.
- Plans and scenarios.
- Milestones and snapshots.
- All derived financial metrics.

The workspace selector should be easy to reach near the top of main screens.

### 5.2 Shared workspaces

Members of a shared workspace operate on the same financial dataset. Home shows
consolidated workspace totals by default. Optional owner filters may be added
later.

### 5.3 Ownership and authorship

Every financial record must distinguish financial ownership from the actor who
created or edited it.

Initial ownership model:

```ts
type Ownership = { type: 'member'; memberId: string } | { type: 'shared' }
```

The design should allow future split ownership, but custom splits are outside
the MVP.

Shared metadata normally includes:

```text
id
workspaceId
createdAt
updatedAt
createdBy
updatedBy
```

Ownership and visibility are different concepts. Private workspace records must
not be introduced until matching Firestore Security Rules are designed and
tested.

---

## 6. Conceptual Firestore model

```text
users/{uid}

workspaces/{workspaceId}
workspaces/{workspaceId}/members/{uid}
workspaces/{workspaceId}/assets/{assetId}
workspaces/{workspaceId}/liabilities/{liabilityId}
workspaces/{workspaceId}/incomeSources/{incomeId}
workspaces/{workspaceId}/expenseDefinitions/{expenseDefinitionId}
workspaces/{workspaceId}/expenseTransactions/{transactionId}
workspaces/{workspaceId}/expenseMonths/{yyyy-MM}
workspaces/{workspaceId}/plans/{planId}
workspaces/{workspaceId}/milestones/{milestoneId}
workspaces/{workspaceId}/financialSnapshots/{snapshotId}

workspaceInvites/{inviteId}
```

Financial collections must not live under `users/{uid}`. Authentication
identifies the actor; workspace membership determines access to financial data.

All records in an MVP workspace use the workspace currency. Records may still
carry a currency field so the schema is explicit and ready for later
multi-currency work. Real currency conversion is outside the MVP.

---

## 7. Expense domain

Expenses are the product’s most important and differentiated domain.

### 7.1 Expense definitions

An expense definition describes an expected part of the user’s Cost of Life.
It may be fixed, periodic, or variable.

Examples include rent, subscriptions, insurance, groceries estimates,
restaurants, holidays, and property tax.

Fixed expenses contribute their normalized annual amount directly. Periodic
expenses retain their real payment schedule while also exposing annual and
monthly equivalents. Variable categories begin with a useful monthly estimate.

### 7.2 Expense transactions

Transactions represent observed spending. They may optionally reference an
expense definition.

Transactions are observations, not an additional Cost of Life layer. Never
calculate Cost of Life as definitions plus all tracked transactions, because
that would double count spending.

### 7.3 Estimated, tracked, and confirmed

- **Estimated:** what a category normally costs.
- **Tracked:** the sum of transactions recorded during a period.
- **Confirmed:** the amount the user believes reasonably represents the closed
  period’s real spending.

Tracked spending may be incomplete and must not silently replace estimates.

### 7.4 Monthly closing

At the end of a month, the app may ask how accurate tracking was:

```text
Complete
Pretty close
Incomplete
```

Internally this may map to `complete | partial | unknown`. A user may confirm
the tracked amount, correct it approximately, or leave it unconfirmed. The flow
must remain low-stress and must never punish incomplete tracking.

Monthly summaries under `expenseMonths/{yyyy-MM}` support historical analysis,
data-quality indicators, and efficient projections. They are summaries, not
the source of raw transaction truth.

### 7.5 Variable projection

An initial domain rule may use:

```ts
projectedVariableAmount = Math.max(estimatedAmount, trackedAmount)
```

This prevents projections from falling below spending that has already
occurred. The rule belongs in pure domain logic, not persisted data, so it can
evolve later.

### 7.6 Data confidence

Expenses may show what proportion of Cost of Life is based on known or
confirmed data versus estimates. This should be subtle and mainly confined to
the Expenses area rather than dominating Home.

---

## 8. Core financial model

### 8.1 Assets and liabilities

Assets may include cash, investments, real estate, crypto, businesses, and
other holdings. Liabilities may include mortgages, personal loans, credit, and
other debt.

```text
Net Worth = Total Assets - Total Liabilities
```

Complex automatic amortization is outside the MVP. Liability balances are
updated manually until a reliable schedule model exists.

### 8.2 Income

Support multiple income sources with ownership and frequency. Normalize each
source to monthly and annual equivalents in domain calculations.

### 8.3 Savings capacity

```text
Savings Capacity = Annual Income - Annual Cost of Life
```

Also expose monthly capacity and savings rate.

Savings capacity is a projection, not proof of money actually saved. Keep these
concepts separate:

```text
Potential savings
Actual savings
Invested amount
```

### 8.4 Financial Position

Home should remain extremely clean and prioritize:

- Active workspace.
- Net worth.
- Assets and liabilities.
- Annual income.
- Annual Cost of Life.
- Annual and monthly savings capacity.
- Savings rate.

Income, expenses, and savings capacity should read as one equation. Assets,
liabilities, income, and expenses should link to their respective detail areas.
Home should not become a chart dashboard.

---

## 9. Plan and future

Plan answers: **What can I do with my financial capacity?**

Possible inputs include current investment capital, planned monthly investment,
expected return, inflation, horizon, goals, and optional FIRE assumptions.

Possible outputs include projected portfolios, FIRE targets and dates, Coast
FIRE, and milestones.

Worthward is not a FIRE-only product. FIRE is an advanced planning layer.
The app must not recommend specific financial products.

Savings capacity and planned investment are not equivalent:

```text
Savings Capacity
- Planned Investment
= Remaining Buffer
```

### 9.1 What-if scenarios

Scenarios answer how a temporary change affects the future, such as a salary
increase, lower expenses, different returns, one lost income, or a house
purchase.

Scenario overrides must never change real workspace data unless explicitly
applied by the user.

```text
Current Financial State
        ↓
Scenario Overrides
        ↓
Domain Calculation Engine
        ↓
Scenario Results
```

The first implementation may keep scenarios local and temporary. Persistence
can be added through an explicit “Save scenario” action.

### 9.2 Sensitivity analysis

Sensitivity analysis varies one assumption across a range. Initial candidates
are monthly investment, Annual Cost of Life, expected return, and annual
income. Keep it visually simple rather than creating an Excel-like interface.

---

## 10. Progress

Progress may show historical evolution of net worth, Annual Cost of Life,
savings rate, savings capacity, investment progress, and FIRE progress.

It should rely primarily on immutable financial snapshots rather than
recalculating historical periods from the current state.

Potential milestones include net-worth levels, invested-asset levels,
financial-independence percentages, and completion of an emergency fund.

The page should remain visually restrained and use only graphs that add clear
meaning.

---

## 11. Domain and application architecture

Financial formulas must not live in Vue components, Pinia stores, Firebase
services, or templates. They belong in pure, testable TypeScript functions.

Core examples include:

```text
calculateNetWorth
calculateAnnualIncome
calculateAnnualFixedExpenses
calculateAnnualPeriodicExpenses
calculateProjectedVariableExpenses
calculateAnnualCostOfLife
calculateSavingsCapacity
calculateSavingsRate
calculateFireNumber
calculatePortfolioProjection
calculateScenario
calculateSensitivitySeries
```

These functions must not depend on Vue, Pinia, Firebase, Quasar, or Capacitor.

Use pragmatic clean architecture without unnecessary repositories, DTOs,
mappers, facades, adapters, or use-case layers.

Target flow:

```text
Firebase
   ↓
Firebase services
   ↓
Pinia stores
   ↓
Domain calculations
   ↓
Composables
   ↓
Vue pages and components
```

Financial Position and similar metrics are derived state. Do not create stores
for values that can be calculated safely from source stores.

Prefer small reusable components, typed models, minimal dependencies, and
comments that explain domain assumptions or non-obvious constraints.

Existing projects under `/references` may be inspected for reusable domain
logic and patterns, but they remain strictly read-only. Prefer adapting proven
financial logic over copying their previous form-heavy UX.

---

## 12. Authentication and authorization

Initial authentication supports email/password and Google. Apple may be added
later.

After login, the application should:

1. Load the user profile.
2. Discover workspace memberships.
3. Select a valid default workspace when possible.
4. Otherwise select the first available workspace.
5. If none exist, allow creation of the first workspace.

Firestore membership documents are the source of truth for authorization.
Security Rules should provide conceptual checks such as:

```text
isWorkspaceMember(workspaceId)
isWorkspaceOwner(workspaceId)
```

Financial subcollections require authenticated workspace membership. Destructive
or administrative actions such as deleting a workspace, changing roles, or
removing members may be owner-only.

Frontend checks improve UX but must never be trusted for authorization.

Invitation acceptance is security-sensitive and is a likely use case for a
Firebase Function. Arbitrary client code must never be able to grant itself
workspace membership.

---

## 13. Offline strategy

Use Firestore’s cache, optimistic writes, and synchronization for the MVP. Do
not add Dexie and create a second synchronization system.

Dexie may only be reconsidered if the product later becomes strongly
local-first and Firestore persistence proves insufficient.

---

## 14. Delivery phases

### Phase 1 — Foundation

- Firebase Authentication.
- User profile.
- Financial Workspace model.
- Workspace creation and membership.
- Active workspace and selector.
- Initial Security Rules.

### Phase 2 — Product shell

- Base design system.
- Main navigation.
- Empty states.
- Premium visual language.

### Phase 3 — Financial Position

- Assets.
- Liabilities.
- Income sources.
- Net worth and annual income.
- Financial Position home.

### Phase 4 — Cost of Life foundations

- Fixed expense definitions.
- Periodic expense definitions.
- Variable estimates.
- Initial Annual and Monthly Cost of Life.

### Phase 5 — Learning loop

- Expense transactions.
- Daily tracking.
- Monthly closing.
- Estimated, tracked, and confirmed values.
- Refined Cost of Life and savings capacity.

### Phase 6 — Planning

- Plan assumptions.
- Portfolio projection.
- FIRE calculations.

### Phase 7 — Exploration

- What-if scenarios.
- Sensitivity analysis.

### Phase 8 — Progress

- Financial snapshots.
- Historical progress.
- Milestones.

### Phase 9 — Collaboration and native release

- Workspace invitations.
- Shared-workspace refinement.
- Production Capacitor builds for Android and iOS.

The exact collaboration schedule may move earlier if product needs require it,
but advanced collaboration should not precede a stable financial domain.

---

## 15. Explicitly outside the MVP

- Open Banking and bank synchronization.
- Broker integrations.
- AI features.
- Receipt OCR.
- Complex budgeting.
- Advanced split ownership.
- Multi-level permissions.
- Private workspace records.
- Dynamic foreign-exchange conversion.
- Automated investment recommendations.
- Automated mortgage amortization.
- Large import/export workflows.
- Excessive charts or gamification.

Scope should not expand accidentally while implementing the first version.

---

## 16. Open decisions

These questions must be decided close to the phase where they become relevant:

1. Whether the current JavaScript codebase migrates to TypeScript immediately
   or incrementally.
2. Whether monetary values are persisted in minor units such as cents. This is
   the preferred direction to avoid floating-point errors.
3. The exact representation and normalization rules for custom frequencies.
4. Whether monthly expense confirmation is global, per category, or both.
5. How workspace memberships are discovered efficiently while membership
   documents remain the authorization source of truth.
6. Whether initial workspace creation is secured through Firestore atomic
   writes and Rules or a callable Function.
7. What happens to financial ownership when a member leaves a workspace.
8. When and how financial snapshots are created.
9. How collaborative write conflicts are presented to users.
10. The native Google and Apple authentication strategy for Capacitor builds.

---

## 17. Implementation guardrails

Before significant implementation work:

1. Inspect the active project and relevant read-only references.
2. Identify reusable financial logic and domain knowledge.
3. Separate reusable domain logic from legacy UX.
4. Propose only the minimum architecture required for the current phase.
5. Avoid creating many speculative files or abstractions.
6. Preserve the Financial Workspace ownership model.
7. Keep Cost of Life derived from a single expense source of truth.
8. Explicitly prevent financial double counting.
9. Keep stored and derived data conceptually separate.
10. Add tests for financial formulas and security-sensitive rules.

The product succeeds when it can answer, calmly and credibly:

```text
Where am I?
What does my life cost?
What can I save?
What happens if something changes?
Where will that take me?
```

---

## 18. Hoja de ruta: Android, Freemium y Pro

> Estado: planificación de producto. Esta sección no describe funcionalidad ya implementada;
> el estado real del repositorio se documenta en el `README.md`.

### Objetivo

Publicar Worthward en Google Play como aplicación Android construida con Quasar + Capacitor y monetizarla con un único nivel Pro:

- Free: aplicación financiera completa para un workspace personal.
- Pro mensual: 3,99 EUR/mes.
- Pro anual: 34,99 EUR/año.
- Prueba promocional: 30 días, activada voluntariamente y sin medio de pago.
- Los invitados no pagan: heredan las capacidades del propietario dentro del workspace compartido.
- La pérdida de Pro nunca borra datos.

### Decisiones de producto para la primera versión

1. Un solo producto de suscripción de Google Play, con dos planes base: mensual y anual.
2. La prueba de 30 días será un derecho promocional gestionado por Worthward, no una prueba autorrenovable de Google Play. Así no requiere tarjeta ni produce un cobro al terminar.
3. La prueba se activa a petición del usuario, una sola vez por cuenta.
4. Máximo de 5 miembros totales por workspace, incluido el propietario.
5. Un usuario Free puede tener un workspace propio editable y participar en workspaces Pro de terceros.
6. Al caducar Pro:
   - el workspace propio principal continúa editable con capacidades Free;
   - los workspaces adicionales quedan en solo lectura;
   - los workspaces compartidos propiedad del usuario quedan en solo lectura para todos;
   - no se elimina ningún documento;
   - si el propietario recupera Pro, se recupera la edición sin migraciones.
7. La primera versión será Google Play solamente. La arquitectura de derechos será independiente del proveedor para poder añadir App Store o web después.

### Arquitectura propuesta

#### Fuente de verdad

Google Play es la fuente de verdad de la compra. Firestore mantiene una proyección de la suscripción para resolver permisos con rapidez. El cliente nunca puede concederse Pro escribiendo en Firestore.

Flujo de una compra:

1. La app obtiene de Google Play los planes y precios localizados.
2. El usuario inicia la compra en el flujo nativo de Play.
3. La app envía el `purchaseToken` a una Firebase Callable Function.
4. La Function consulta Google Play Developer API y valida paquete, producto, estado y cuenta.
5. El backend persiste la compra y recalcula los derechos del usuario.
6. El backend confirma la compra a Google Play cuando corresponde.
7. Las Real-time Developer Notifications mantienen Firestore sincronizado ante renovaciones, cancelaciones, reembolsos, periodos de gracia y suspensiones.

#### Modelo de datos mínimo

No se guardará una propiedad editable `isPro` en el perfil público del usuario.

```text
users/{uid}/private/subscription
  plan: "free" | "pro"
  source: "trial" | "google_play" | null
  status: "none" | "trialing" | "active" | "grace_period" |
          "on_hold" | "canceled" | "expired" | "revoked"
  entitlementActive: boolean
  trialStartedAt: Timestamp | null
  trialEndsAt: Timestamp | null
  trialConsumed: boolean
  currentPeriodEndsAt: Timestamp | null
  productId: string | null
  basePlanId: string | null
  purchaseTokenHash: string | null
  updatedAt: Timestamp

billingPurchases/{purchaseTokenHash}
  userId: string
  provider: "google_play"
  packageName: string
  productId: string
  basePlanId: string
  purchaseToken: string             # sólo backend; valorar cifrado/KMS
  externalAccountId: string
  providerState: string
  expiryTime: Timestamp | null
  acknowledgementState: string
  latestOrderId: string | null
  updatedAt: Timestamp

billingEvents/{providerMessageId}
  type: string
  processedAt: Timestamp
  purchaseTokenHash: string

workspaces/{workspaceId}
  ownerId: string                   # añadir explícitamente
  type: "personal" | "shared"
  memberIds: string[]
  members: map
  createdAt: Timestamp
```

`billingEvents` permite procesar notificaciones de forma idempotente. Los documentos de facturación no serán legibles ni escribibles directamente por el cliente.

#### Resolución de derechos

Una función compartida de backend calculará, como mínimo:

```text
userEntitlements(userId)
  canCreateAdditionalWorkspace
  canCreateSharedWorkspace
  canUseAdvancedModelsInPersonalWorkspace

workspaceEntitlements(workspaceId, userId)
  isMember
  isOwner
  tier: "free" | "pro"
  canRead
  canWrite
  canInvite
  canUseAdvancedModels
  reason
```

Reglas principales:

- El nivel efectivo del workspace depende de la suscripción o prueba del propietario.
- Ser invitado de un workspace Pro sólo concede Pro dentro de ese workspace.
- Sólo el propietario administra invitaciones, miembros, transferencia y borrado.
- Todo write sensible se vuelve a validar en Functions o reglas; el bloqueo visual es únicamente UX.

### Fases de implementación

#### Fase 0 — Cerrar contrato de producto y catálogo

Entregables:

- Confirmar el límite de 5 miembros totales.
- Clasificar cada ruta/capacidad como Free o Pro. Primera propuesta:
  - Free: Home básico, Assets, Liabilities, Income, Expenses, Tracker, Review, Progress y achievements.
  - Pro: Plan/Your Strategy, What If, Life Decisions, modelos L3, simuladores y proyecciones.
- Elegir el workspace principal cuando existan varios. Recomendación: marcarlo de forma explícita y no inferirlo por fecha.
- Reservar identificadores estables:
  - package: `com.costoflife.app` (confirmar antes de generar y publicar);
  - subscription product: `cost_of_life_pro`;
  - base plans: `monthly` y `annual`.
- Definir textos de paywall, restauración, caducidad y solo lectura.

Criterio de salida: existe una matriz de capacidades única que pueden consumir cliente, Functions y tests.

#### Fase 1 — Crear la aplicación Capacitor Android

Trabajo:

- Comprobar Java, Android Studio y Android SDK compatibles con la versión de Capacitor elegida.
- Añadir modo Capacitor a Quasar con el package y nombre definitivos.
- Generar `src-capacitor` y la plataforma Android.
- Añadir scripts reproducibles para desarrollo, sincronización y build Android.
- Configurar icono adaptativo, splash, nombre, colores, versión y orientación.
- Configurar app links/deep links para invitaciones.
- Sustituir o adaptar el login de Google basado en popup/redirect web por un flujo compatible con Android nativo.
- Registrar la aplicación Android en Firebase y añadir la configuración Android sin versionar secretos innecesarios.
- Generar una clave de subida y guardarla fuera del repositorio; activar Play App Signing.

Verificación:

- Compilación debug limpia.
- Login, logout y persistencia de sesión en emulador y dispositivo físico.
- Apertura de una invitación desde un enlace.
- Lectura y escritura de un workspace existente.
- Build `.aab` release firmado.

#### Fase 2 — Núcleo de suscripciones y derechos

Trabajo:

- Añadir el modelo privado de suscripción y el historial de compras.
- Implementar `startProTrial`, transaccional e idempotente:
  - usuario autenticado;
  - `trialConsumed == false`;
  - fija 30 días usando reloj del servidor;
  - no admite reinicio ni extensión desde cliente.
- Crear el resolvedor central de derechos.
- Añadir `ownerId` explícito a nuevos workspaces y migrar los actuales desde el miembro con rol `owner`.
- Mover la creación de workspaces a una Callable Function para aplicar el límite Free de forma atómica.
- Restringir creación de invitaciones a propietarios Pro y máximo de 5 miembros.
- Añadir transferencia de propiedad a otro miembro Pro antes de que sea necesaria operativamente.
- Exponer al cliente una vista segura y mínima de sus derechos efectivos.

Verificación:

- Tests unitarios de la máquina de estados y la matriz Free/Pro/invitado.
- Tests de concurrencia: doble activación de prueba, dos creaciones simultáneas y dos aceptaciones para la última plaza.
- Tests que prueben que el cliente no puede modificar su suscripción.

#### Fase 3 — Google Play Billing

Trabajo en Play Console:

- Crear la ficha de la aplicación y completar la verificación de cuenta/pagos.
- Crear `cost_of_life_pro`, con planes base mensual y anual y precios localizados.
- Configurar periodo de gracia y account hold.
- Vincular Play Console con el proyecto de Google Cloud/Firebase.
- Crear el topic de Pub/Sub para Real-time Developer Notifications y su suscripción push.
- Dar a la identidad del backend únicamente los permisos necesarios de Android Publisher.

Trabajo en la app:

- Seleccionar e integrar una capa de compras Capacitor mantenida y compatible con la versión actual de Google Play Billing. Congelar la elección tras un pequeño prototipo técnico.
- Consultar productos y precios en tiempo real; no codificar `3,99 €` en el botón de compra.
- Implementar compra, restauración/reconciliación, compras pendientes, errores y apertura de la gestión de suscripción.
- Asociar la compra al UID mediante un identificador ofuscado, nunca enviando el UID en claro a Play.

Trabajo en Functions:

- `verifyGooglePlaySubscription(purchaseToken, productId)`.
- Endpoint push para RTDN con autenticación y deduplicación por `messageId`.
- Consulta a `purchases.subscriptionsv2.get`; no confiar en el payload de Pub/Sub como estado final.
- Confirmación de compras nuevas verificadas.
- Reconciliación periódica de suscripciones activas como red de seguridad.
- Manejo explícito de `ACTIVE`, periodo de gracia, `ON_HOLD`, cancelada con acceso hasta expiración, expirada y revocada.

Verificación:

- License testers y tracks de prueba interna/cerrada.
- Compra mensual y anual.
- Compra pendiente que después se completa y que se cancela.
- Cancelación con acceso hasta fin de periodo.
- Renovación, periodo de gracia, account hold, recuperación, expiración, reembolso y revocación.
- Restauración al reinstalar y al iniciar sesión en otro dispositivo.
- La misma compra no puede concederse a dos cuentas de Worthward.

#### Fase 4 — Aplicar monetización a workspaces y funciones Pro

Trabajo:

- Añadir guardas de ruta y componentes de paywall con una única fuente de capacidades.
- Ocultar o marcar como Pro las funciones avanzadas sin eliminar rutas necesarias para explicar la mejora.
- Validar en Functions todas las mutaciones de modelos avanzados.
- Reforzar Firestore Rules para que un workspace bloqueado sólo permita lectura.
- Impedir a un Free crear workspaces adicionales o invitaciones.
- Mantener acceso Pro completo a invitados Free dentro de un workspace cuyo propietario tenga derecho activo.
- Implementar estados de solo lectura claros, con CTA para renovar o transferir propiedad cuando corresponda.
- Evitar escrituras indirectas en segundo plano (sincronización de portfolios, milestones, etc.) cuando el workspace está bloqueado.

Verificación:

- Matriz completa con propietario Free, trial, Pro, gracia, on-hold y expirado; invitado Free y Pro.
- Ningún test se limita a comprobar botones: se intentan writes directos y Callables.
- La caducidad no borra ni modifica datos financieros.

#### Fase 5 — Experiencia comercial y cumplimiento

Pantallas:

- Comparativa Free/Pro.
- Activación voluntaria de prueba y contador de días.
- Paywall con precios localizados de Play y condiciones de renovación.
- Estado de suscripción, fecha de próxima renovación/fin de acceso y botón “Gestionar en Google Play”.
- Mensajes de periodo de gracia, pago rechazado, solo lectura y expiración.
- Política de privacidad, términos, soporte y eliminación de cuenta/datos.

Cumplimiento para publicación:

- Usar Google Play Billing para desbloquear estas funciones digitales dentro de la app distribuida por Play.
- Completar Data safety, clasificación de contenido, audiencia, acceso para revisión y declaraciones financieras pertinentes.
- Revisar SDK Data Safety de Firebase y del plugin de compras.
- Publicar Android App Bundle apuntando al nivel de API exigido en la fecha de envío.
- No mostrar enlaces o llamadas a un pago web dentro de la app salvo que se adopte formalmente un programa permitido por Google para la región aplicable.

#### Fase 6 — Lanzamiento gradual y observabilidad

Orden recomendado:

1. Prueba interna con cuentas de licencia.
2. Prueba cerrada con un grupo pequeño.
3. Producción gradual: 5 %, 20 %, 50 %, 100 %.

Telemetría mínima, sin datos financieros:

- prueba iniciada y finalizada;
- paywall visto;
- flujo de compra iniciado, completado, pendiente o cancelado;
- validación/confirmación fallida;
- RTDN recibida y procesada;
- transición de estado de suscripción;
- workspace pasado a solo lectura o recuperado.

Alertas:

- errores sostenidos de Android Publisher API;
- mensajes RTDN en dead-letter queue;
- compras sin confirmar;
- divergencia entre Firestore y Google Play;
- Functions de billing con error o latencia anormal.

### Orden de pull requests recomendado

1. `android/capacitor-bootstrap`: scaffold Android, identidad, Firebase Android, login y build firmado de prueba.
2. `billing/entitlements-domain`: esquema, máquina de estados, resolvedor y tests.
3. `billing/trial`: activación de prueba, UI y antiabuso básico.
4. `workspaces/ownership-and-limits`: `ownerId`, migración, creación en backend, 5 miembros y transferencia.
5. `billing/play-client`: catálogo, compra, restauración y estados de UI.
6. `billing/play-backend`: verificación, confirmación, RTDN y reconciliación.
7. `billing/enforcement`: Functions, reglas, rutas, writes de fondo y solo lectura.
8. `release/play-console`: cumplimiento, observabilidad, pruebas cerradas y AAB de producción.

Cada PR debe poder desplegarse sin habilitar la monetización mediante un feature flag administrado en backend. El flag sólo controla exposición; nunca sustituye las comprobaciones de permisos.

### Estimación orientativa

Para una persona familiarizada con el proyecto:

- Capacitor, Android, autenticación y build: 3–5 días.
- Dominio de derechos, prueba y workspaces: 5–8 días.
- Play Billing, backend y RTDN: 6–10 días.
- Paywalls, solo lectura y enforcement completo: 5–8 días.
- QA, cumplimiento y publicación: 4–7 días, sin contar esperas de revisión o verificación de Google.

Total técnico aproximado: 23–38 días laborables. La parte de mayor riesgo es el ciclo completo de billing y su sincronización, no el scaffold de Capacitor.

### Definition of Done para el MVP monetizado

- La aplicación se instala desde un track de Google Play y autentica correctamente.
- Free puede gestionar un workspace personal sin límites de registros.
- La prueba se activa una sola vez, dura 30 días de servidor y no cobra al terminar.
- Las compras mensual y anual conceden Pro sólo tras validación de backend.
- Renovaciones, cancelaciones, gracia, hold, expiración y reembolsos actualizan los derechos.
- Un invitado Free usa capacidades Pro dentro del workspace de un propietario Pro.
- Al perder Pro, los workspaces definidos pasan a solo lectura sin pérdida de datos.
- El cliente no puede saltarse ninguna restricción manipulando Firestore o invocando una Function.
- Existe restauración/reconciliación, métricas, alertas y procedimiento de soporte.
- El AAB cumple los requisitos vigentes de Google Play y supera pruebas internas y cerradas.
