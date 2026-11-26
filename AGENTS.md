# Worthward contributor guidance

## UI and design system

Before adding presentation styles, inspect `src/css/foundation`, `src/components/ui`, `src/components/layout` and the relevant domain components.

- Use the semantic typography roles from `src/css/foundation/_typography.scss`; do not recreate common page, card, KPI, row, caption or table-header typography in scoped styles.
- Use runtime tokens from `_tokens.scss` for shared colour, spacing, radius, surface, icon and responsive decisions.
- Use breakpoints from `_breakpoints.scss`. A local breakpoint is acceptable only when a component's content or structure requires it.
- Reuse `AppPageHeader`, `AppCard`, dialog primitives, empty states and financial compositions before creating an equivalent component.
- Keep desktop and mobile on the same semantic roles. Local media queries should adapt structure, wrapping, charts or tables rather than create a second visual system.
- Keep feature-specific structure scoped to the component. A visual exception must be intentional and explained by the domain or content.
- Do not add a shared abstraction until it has a clear repeated responsibility. Prefer Quasar primitives when they already provide the required behavior.

For visual work, run `npm run lint:check`, `npm test` and `npm run build`. In development, `/design-system` is the responsive preview for production tokens and components.
