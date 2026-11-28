# Sistema de diseño

Worthward usa Quasar como base y una capa pequeña de semántica visual propia. El objetivo es una
interfaz financiera clara, calmada y consistente, no reemplazar Quasar con otra librería.

## Arquitectura SCSS

```text
src/css/
  app.scss                         manifiesto global
  quasar.variables.scss            tokens de build de Quasar
  foundation/
    _tokens.scss                   custom properties runtime
    _breakpoints.scss              breakpoints Sass canónicos
    _typography.scss               roles tipográficos globales
    _base.scss                     fundamentos del documento
  components/                      contratos visuales compartidos
  themes/_expense-categories.scss  paleta del dominio de gastos
  _mixins.scss                     patrones financieros reutilizables
```

`app.scss` debe seguir siendo un manifiesto. La composición específica permanece en estilos scoped
del componente. Usa módulos Sass con namespace; no muevas CSS a global solo para acortar un archivo.

## Tokens

Usa custom properties de `_tokens.scss` para decisiones compartidas:

- marca y superficies: `--color-primary`, `--color-page`, `--color-surface*`;
- texto y bordes: `--color-ink*`, `--color-copy`, `--color-muted`, `--color-line*`;
- roles financieros: `--color-financial-assets`, `liabilities`, `income`, `expenses`;
- spacing: `--space-1` a `--space-10`;
- composición: paddings de página/card, gaps e icon sizes.

No uses el color de una categoría para cambiar el significado de un resultado. Positivo/negativo es
semántica financiera; categorías y series de charts pueden conservar paletas categóricas.

## Tipografía semántica

Usa roles globales, sin recrearlos en scoped CSS:

- página: `app-page-title`, `app-page-title--hero`, `app-page-subtitle`;
- secciones/cards: `app-section-title`, `app-section-label`, `app-card-title`, `app-card-subtitle`;
- KPIs: `app-kpi-label`, `app-kpi-value`, `app-kpi-value-secondary`, `app-kpi-supporting`;
- resultados: `app-tone-positive`, `app-tone-negative`, `app-result--negative`;
- filas/tablas: `app-row-title`, `app-row-value`, `app-table-header`;
- copy: `app-body`, `app-caption`.

Sentence case es el valor predeterminado. Solo `app-section-label` usa uppercase intencional.

## Breakpoints

Importa `src/css/foundation/_breakpoints.scss`:

- `$xs-max`: 599 px;
- `$sm-max`: 699 px;
- `$content-compact-max`: 760 px;
- `$md-max`: 899 px;
- `$desktop-min`: 1024 px.

Un componente puede justificar un breakpoint local por su contenido. Desktop y mobile conservan los
mismos roles; las media queries adaptan estructura, wrapping, tablas, formularios y gráficos.

## Componentes compartidos

- `AppPageHeader`: título de ruta, subtítulo, back, acciones y acceso contextual a Learn.
- `AppCard`: superficie, padding, heading, icono y acciones. `tone` cambia acentos, no inventa otra
  jerarquía de cards.
- `AppConfirmDialog`: confirmación, sizing, cancelar/cerrar y loading.
- `AppFormDialog`: card, form, body scrollable y footer de acciones; el dominio conserva estado.
- `AppPeriodSwitch`: selector segmentado pequeño; no sustituye navegación con tabs.
- `AppEmptyState`: estado vacío y acción contextual.
- `FinancialKpiOverview`: composición KPI/chart responsive.
- `DashboardCard`: composición de compatibilidad construida sobre `AppCard`.

Componentes de ownership, posiciones, milestones y editores permanecen en sus dominios. Crea una
abstracción solo cuando dos o más callers compartan la misma responsabilidad estructural.

## Quasar y diálogos

Prefiere `q-btn`, `q-input`, `q-select`, `q-dialog`, `q-table` y `q-tabs` cuando basten. Conserva
`persistent`, fullscreen/bottom positioning, safe areas, scroll ownership y estados disabled/loading.
Limita `:deep()` a markup generado y bajo una raíz del componente.

## Gráficos

`src/config/chart-theme.js` contiene roles y paletas que ECharts no puede leer desde Sass. Una serie
puede tener color local si codifica una categoría propia. Ejes, tooltips y valores deben usar las
utilidades de formato y soportar valores largos/negativos.

## Terminología

- **Cost of Life**, no “Cost of Living”, para el modelo de gastos.
- **Available income** es ingreso disponible; **savings capacity** es lo restante tras Cost of Life.
- **Net worth** es assets menos liabilities.
- **Wealth creation** describe el cambio; **wealth composition**, la composición.
- **Financial freedom** usa años de Cost of Life cubiertos por riqueza invertible.
- Categorías: **Cash & savings**, **Investments** y **Debt**.

Todo texto visible usa Vue I18n. La interfaz actual solo contiene `en-US`.

## Welcome y Worthward Learn

`WelcomeEntry` es la entrada para cuentas sin workspace: ofrece demo o creación, no un wizard
obligatorio. Debe reutilizar roles de página/card y mantener paridad funcional móvil/escritorio.

Worthward Learn es contextual. `src/learn/registry.js` decide qué rutas y categorías muestran el
control en `AppPageHeader`; `LearnPanel` presenta el contenido. Añadir un tema exige registro,
traducciones, componente si corresponde y tests del contexto. No expongas Learn globalmente sin una
decisión de producto.

## Validación

Para cambios visuales:

```bash
npm run lint:check
npm test
npm run build
```

Revisa `/design-system`, teclado, scroll de diálogos, loading/disabled y anchos 360, 390, 768, 1024
y 1440 px. No existe regresión visual automatizada; no afirmes equivalencia exacta sin capturas.
