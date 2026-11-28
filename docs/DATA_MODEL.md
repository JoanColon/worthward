# Modelo de datos

## Convenciones

Firestore es la persistencia principal. Todos los datos financieros pertenecen a un workspace. Los
IDs de categorías, subtipos, milestones y modelos forman parte del contrato persistido y no deben
renombrarse por motivos de presentación o marca.

Las definiciones exactas se validan en los normalizadores de `functions/shared/`, servicios y tests;
este documento describe relaciones y fronteras, no duplica cada campo.

## Colecciones raíz

### `users/{uid}`

Documento de preferencias del usuario:

- `activeWorkspaceId`: workspace persistente seleccionado; nunca puede ser el demo;
- `quickLinksByWorkspace`: accesos rápidos por workspace;
- `updatedAt`.

El cliente autenticado solo puede escribir esos campos en su propio documento.

#### `users/{uid}/private/subscription`

Proyección privada de la cuenta: plan, proveedor, estado, expiración y activación autoritativa. El
usuario puede leerla; solo Admin SDK escribe.

#### `users/{uid}/private/trial`

Trial promocional consumible una vez: `startedAt`, `expiresAt` y `endedNoticeShownAt`. Lectura del
propio usuario y escritura exclusiva de Functions.

### `billingPurchases/{purchaseTokenHash}`

Registro autoritativo de una compra Google Play. El ID es SHA-256 del purchase token. Conserva la
relación con usuario, producto, base plan, estado, expiración y acknowledgement. No admite acceso de
cliente.

### `workspaceInvites/{tokenHash}`

Invitación de un solo uso cuyo ID es el hash del token. Contiene workspace, rol, expiración y estado
de consumo. Solo Functions puede acceder.

## `workspaces/{workspaceId}`

Campos centrales:

- identidad, nombre, moneda y tipo informativo;
- `createdBy` como owner original;
- `memberIds` como fuente de membership;
- `members` como mapa de rol, nombre y metadatos;
- `entitlement` como proyección efectiva del owner;
- `milestoneTracking`;
- marcas de creación, actualización y borrado pendiente.

`members` no sustituye a `memberIds` para autorización. El tipo `personal/shared` describe la
composición, pero no concede acceso.

`worthward_demo` es un ID reservado. Se descubre fuera de la consulta ordinaria de membership y no
se guarda como workspace activo del usuario.

## Configuración y modelo fuente

### `workspaces/{id}/modelConfig/{section}`

Configuración por dominio, incluyendo selecciones de categorías, `whatIf` y `whatIfStrategies`.
What If y Strategy son documentos separados: guardar Strategy no elimina la configuración Free.

### Colecciones `model*`

- `modelAssets`
- `modelLiabilities`
- `modelIncome`
- `modelExpenses`

Cada documento tiene categoría/subtipo, valores del dominio, ownership y, cuando corresponde,
`detail` versionado para modelos avanzados. Las categorías simples pueden usar documentos de
configuración estables; los elementos con identidad propia conservan su ID durante actualizaciones.

Las mutaciones pasan por `mutateFinancialModel`; el cliente no escribe directamente estas
colecciones. El servicio valida schema, membership, ownership, relaciones y capacidades Pro.

## Ownership

El ownership puede representar el conjunto o shares por miembro. Una asignación compartida debe:

- referenciar exclusivamente `memberIds` actuales;
- contener shares válidos;
- sumar exactamente el 100 % según las utilidades canónicas;
- conservarse en documentos fuente y proyecciones derivadas.

La eliminación de un miembro exige reconciliar datos relacionados; no debe dejar porcentajes hacia
miembros inexistentes.

## Tracking y reconciliación

`workspaces/{id}/expenseTracking/{YYYY-MM}` conserva gasto registrado y reconciliación mensual. Sus
ítems retienen ownership, categoría, subcategoría y relación opcional con el modelo. Es información
de periodo distinta del modelo anual estimado.

Los clientes pueden escribir tracking si son miembros de un workspace activo; normalizadores y
Rules protegen las fronteras aplicables. El demo no admite estas escrituras.

## `financialYears/{YYYY}`

Vista materializada de solo lectura para clientes, actualmente `schemaVersion: 1`:

- estado anual y metadatos de proyección;
- doce meses;
- secciones de assets, liabilities, income y expenses;
- desgloses por categoría, ítem y miembro;
- estados de posición observada/cerrada.

El año actual se crea bajo demanda y se actualiza al cambiar las fuentes. Años y meses cerrados
preservan historia. No debe mantenerse otra colección paralela de posiciones históricas.

## `achievements/{milestoneId}`

Estado personal de milestones para el workspace: pendiente o conseguido, fechas y evidencia
derivada. El ID procede de las definiciones canónicas. El cliente calcula diffs y escribe por batch;
un valor que deja de cumplir puede retirar el documento.

## Modelos avanzados

- `detail.cash`: versión de schema y rentabilidad anual; no reemplaza el saldo observado.
- `detail.realEstate`: compra y apreciación; deriva valoración y equity.
- `detail.mortgage`: principal, tipo, plazo, fecha, cuota y relación opcional con inmueble/gasto.
- portfolio de inversión: configuración Google Sheets, summary, cache v3, holdings, dividendos,
  warnings y tiempos de refresco.

Los modelos avanzados requieren Pro para mutar. Un modelo existente no concede derechos y no se
borra al expirar Pro.

## Borrado y compatibilidad

El borrado de workspace y cuenta usa Functions para eliminar relaciones y subcolecciones de forma
controlada. `deletionPendingAt` impide nuevas escrituras mientras se completa el proceso.

Antes de cambiar un campo persistido:

1. localiza lectores, escritores, normalizadores, Rules y tests;
2. preserva lectura de datos existentes o define una migración;
3. incrementa schema version solo cuando exista estrategia de compatibilidad;
4. no reutilices un ID con un significado financiero diferente;
5. valida documentos fuente y `financialYears`.
