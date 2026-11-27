# Worthward UI design system

Worthward uses Quasar as its UI foundation and adds a small application layer for visual semantics and repeated compositions. The design system preserves the current light, professional financial identity; it is not a replacement component library for Quasar.

## SCSS architecture

```text
src/css/
├── app.scss                         Global entry point only
├── quasar.variables.scss            Quasar build-time palette
├── foundation/
│   ├── _tokens.scss                 Runtime CSS custom properties
│   ├── _breakpoints.scss            Canonical Sass media-query values
│   ├── _typography.scss             Global semantic type roles
│   └── _base.scss                   Document and responsive foundations
├── components/
│   ├── _app-card.scss               Shared AppCard surface and variants
│   ├── _buttons.scss                Shared q-btn conventions
│   ├── _financial-overview.scss     Shared financial KPI composition
│   └── _quasar-overrides.scss       Intentional global Quasar overrides
├── themes/
│   └── _expense-categories.scss     Expense category palette mixin
└── _mixins.scss                     Financial layout/domain mixins
```

`app.scss` must remain an import manifest. Global output belongs in a foundation or component stylesheet with a clear responsibility. Component-specific composition remains in scoped Vue styles.

Use namespaced Sass modules for new work:

```scss
@use '@/css/foundation/breakpoints' as bp;

@media (max-width: bp.$content-compact-max) {
  // Component-specific responsive behavior.
}
```

Do not move a local style into global CSS merely to shorten a Vue file. A shared mixin is appropriate only when several components need the same declarations but do not share a useful template contract.

## Tokens and semantics

Runtime tokens live in `foundation/_tokens.scss`. Prefer them over new hardcoded values for shared surfaces, text, borders, shadows, focus states and financial roles.

- Brand: `--color-primary`, `--color-primary-dark`, `--color-inverse`.
- Surfaces: `--color-page`, `--color-surface`, `--color-surface-soft`, `--color-surface-muted`.
- Text: `--color-ink`, `--color-ink-soft`, `--color-copy`, `--color-muted`.
- Borders and focus: `--color-line`, `--color-line-strong`, `--color-primary-focus`.
- Financial roles: `--color-financial-assets`, `--color-financial-liabilities`, `--color-financial-income`, `--color-financial-expenses`.
- Spacing: `--space-1` through `--space-10`; use the smallest existing step that matches the composition.
- Responsive composition: `--page-padding-*`, `--page-section-gap`, `--card-padding`, `--card-gap`, `--card-header-gap` and shared icon sizes.

## Semantic typography

Use the global roles directly in templates. Their responsive values are controlled by tokens, so do not create desktop/mobile variants.

- Page: `app-page-title`, `app-page-title--hero`, `app-page-subtitle`.
- Sections and cards: `app-section-title`, `app-section-label`, `app-card-title`, `app-card-subtitle`.
- Financial data: `app-kpi-label`, `app-kpi-value`, `app-kpi-value-secondary`, `app-kpi-supporting`.
- Financial results: `app-tone-positive`, `app-tone-negative`; add `app-result--negative` to a
  contextual result surface when its primary result is adverse. Category colours must not override
  result meaning.
- Dense content: `app-row-title`, `app-row-value`, `app-table-header`.
- Copy: `app-body`, `app-caption`.

Sentence case is the default. `app-section-label` is the intentional uppercase eyebrow role. Components may override a role only when the content has a materially different function.

## Product terminology

- **Cost of Life** is the canonical Worthward term for the expense model. Do not use “Cost of Living” for the same concept.
- **Available income** is income available to the selected scope; **savings capacity** is what remains after Cost of Life.
- **Net worth** is assets minus liabilities. **Wealth creation** describes its change; **wealth composition** describes its makeup.
- **Financial freedom** is expressed as years of Cost of Life funded by net investable wealth.
- Use **Cash & savings**, **Investments** and **Debt** as category labels. Use sentence case for titles, KPI labels and actions.

Financial meaning and UI validation are separate. A negative performance value is not automatically a form error. Expense category colors and long ordinal chart palettes may remain categorical rather than semantic.

Charts use `src/config/chart-theme.js` because JavaScript renderers cannot consume Sass variables directly. Shared chart roles and palettes belong there; feature-specific colors may remain local when they encode a distinct category.

## Breakpoints

Use the canonical Sass values for application-wide behavior:

- `bp.$xs-max`: compact phone (`599px`).
- `bp.$sm-max`: mobile shell/navigation (`699px`).
- `bp.$content-compact-max`: dense financial content (`760px`).
- `bp.$md-max`: tablet and analytical layouts (`899px`).
- `bp.$desktop-min`: desktop dashboard layout (`1024px`).

A component may use a content breakpoint outside this set when its own table, chart or form demonstrably needs it. Do not replace such values mechanically.

## Shared UI components

### `AppConfirmDialog`

Owns confirmation-dialog presentation, responsive sizing, close/cancel behavior and loading state. The parent owns visibility and business mutation.

- `v-model`: visible state.
- Required props: `title`, `confirm-label`, `cancel-label`.
- Optional props: `message`, `confirm-color`, `confirm-icon`, `loading`, `persistent`, `confirm-first`, `confirm-flat`, `actions-align`, `width`.
- Events: `confirm`, `cancel`, `hide`.
- Default slot: richer explanatory content when a plain message is insufficient.

### `AppFormDialog`

Provides the card, Quasar form, header, scrollable body and fixed action footer for domain forms. It does not own field state or validation rules.

- Props: `title`, `cancel-label`, `width`, `disabled`.
- Default slot: fields and domain content.
- `actions` slot: delete, cancel and submit actions.
- Events: `submit`, `cancel`.
- Exposes Quasar form `validate()` and `resetValidation()` for callers that need imperative validation.

### `AppPeriodSwitch`

A controlled, accessible segmented choice for period and similar small option sets.

- `v-model`: selected value.
- Props: `options`, `aria-label`, `variant` (`financial`, `compact` or `light`), `size`, `disabled`.
- Options contain `value`, `label` and optional `disabled`.

Use `q-tabs` for navigation and larger tab sets; do not use this component as a tab replacement.

### `AppEmptyState`

Provides a consistent card-level empty state with contextual text and an optional action.

- Props: `icon`, `title`, `description`, `action-label`, `action-icon`, `tone`, `compact`.
- Event: `action`.
- `actions` slot: use only when more than one contextual action is genuinely needed.

### Existing components

- `AppPageHeader` owns route-level title, subtitle, back navigation and actions.
- `AppCard` owns the shared white default surface, padding, optional heading, icon and actions. Its
  `tone` changes accents such as the icon, never the card background. An explicit shared semantic
  or interaction state may change the surface when the content requires it—for example a negative
  result, warning or selected card—but feature-scoped styles must not invent background variants
  or gradients.
- `DashboardCard` is a compatibility/domain composition built on `AppCard`.
- `FinancialKpiOverview` owns the shared responsive KPI/chart split used by overview cards.
- `OwnershipEditor`, `OwnershipAvatar`, `SimpleValueEditor`, `PositionCategorySetup` and `MilestoneBadge` remain domain components.

## Quasar conventions

- Prefer `q-btn`, `q-input`, `q-select`, `q-dialog`, `q-table` and `q-tabs` over wrapper components that add no repeated behavior.
- Use Quasar props for semantic color and interaction state; shared SCSS controls dimensions and focus treatment.
- Keep visible text in Vue I18n.
- Preserve `persistent`, fullscreen/bottom positioning, safe-area padding and scroll ownership when migrating a dialog.
- Avoid broad `:deep()` selectors. Scope them under a component root and use them only for generated Quasar markup or an intentional child-component contract.

## Creating new UI

Before adding a component or mixin:

1. Check whether Quasar already supplies the primitive.
2. Check the components above and existing domain components.
3. Introduce a shared abstraction only when at least two callers have the same structural responsibility.
4. Keep calculations, stores and remote access out of generic UI components.
5. Add a semantic token only for a decision that should remain consistent across features.

Page styles should describe page layout. Shared components should describe repeated template and interaction contracts. Mixins should describe repeated CSS patterns that cannot usefully be components.

## Validation

For UI changes run:

```bash
yarn lint:check
yarn test
yarn build
```

The repository has no automated visual-regression suite. Verify affected flows manually on desktop and phone widths, including keyboard focus, dialog scrolling and loading/disabled states. Do not claim pixel equivalence without screenshot comparison.

The development-only route `/design-system` renders production components and edge-case content at browser widths such as 360, 390, 768, 1024 and 1440px. It is removed from production route builds through `import.meta.env.DEV`.
