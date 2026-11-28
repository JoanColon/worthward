# Worthward contributor guidance

Worthward es un workspace de finanzas personales y compartidas construido con Vue 3, Quasar,
Pinia, Firebase y Capacitor. La SPA y Cloud Functions usan JavaScript y ES Modules. El código activo
vive en `src/`, `functions/`, `test/`, `landing/` y `src-capacitor/`; `references/` es exclusivamente de
consulta.

## Selección de contexto

Consulta solo la documentación relacionada con la tarea antes de modificar código:

- producto y comportamiento funcional: `docs/PRODUCT.md`;
- capas, flujos y localización del código: `docs/ARCHITECTURE.md`;
- persistencia, IDs y fronteras de escritura: `docs/DATA_MODEL.md`;
- fórmulas e invariantes: `docs/FINANCIAL_ENGINE.md`;
- autenticación, demo, billing y capacidades: `docs/ACCESS_CONTROL.md`;
- interfaz y responsive: `docs/DESIGN_SYSTEM.md`;
- estrategia de validación: `docs/TESTING.md`;
- decisiones aceptadas o pendientes: `docs/DECISIONS.md`;
- desarrollo, despliegue y demo: `docs/operations/`;
- trabajo complejo en curso: `docs/plans/`.

El código, Firestore Rules y los tests determinan el comportamiento implementado. La política de
producto aprobada vive en `PRODUCT.md` y `DECISIONS.md`. Un plan o documento archivado no es una
fuente normativa.

## Reglas generales

- Inspecciona la implementación y los tests existentes antes de cambiarla.
- Reutiliza componentes, stores, servicios y funciones de dominio; evita lógica duplicada.
- Mantén el cambio dentro del alcance solicitado y no refactorices áreas ajenas.
- No añadas dependencias ni abstracciones sin una responsabilidad repetida y clara.
- Conserva compatibilidad con datos persistidos, IDs estables y versiones de esquema.
- No modifiques `references/`, cambios del usuario, producción ni datos reales sin autorización.
- No hagas commits, pushes o despliegues salvo petición explícita.
- Usa Vue I18n para texto visible y no introduzcas secretos en código o documentación.

## Integridad financiera

- Mantén una implementación canónica por regla financiera, preferentemente en `functions/shared/`
  cuando deba compartirse entre navegador y backend.
- No dupliques cálculos financieros en pages, componentes, stores o Functions.
- Distingue posiciones observadas, flujos estimados, gasto registrado, reconciliación y proyección.
- Evita doble contabilización entre consumo, transferencia, inversión, deuda y pagos relacionados.
- Preserva ownership, porcentajes y selección de scope por miembro.
- No recalcules ni sobrescribas periodos financieros cerrados.
- Revisa el impacto sobre documentos fuente, `financialYears`, Dashboard, Progress, Plan y
  Milestones cuando cambie una regla común.
- No alteres fórmulas o criterios financieros aprobados sin autorización explícita.

## Seguridad y datos

- Preserva el aislamiento entre workspaces. `memberIds` concede membership; `members` aporta roles y
  perfil, pero no sustituye esa comprobación.
- No confíes únicamente en gates del cliente. Revisa Rules, callables y Admin SDK según la frontera
  afectada.
- Las mutaciones del modelo deben mantener la atomicidad entre documentos fuente y proyección anual.
- El workspace `worthward_demo` es legible por usuarios autenticados y no admite persistencia.
- Separa visibilidad de UI, capacidad comercial y autorización efectiva.
- Ningún dato escribible por el cliente puede conceder Pro.
- Perder Pro no elimina datos; las restricciones se resuelven mediante el entitlement vigente.

## UI y sistema de diseño

Antes de añadir estilos, inspecciona `src/css/foundation`, `src/components/ui`,
`src/components/layout` y los componentes del dominio afectado.

- Usa los roles de `_typography.scss`, tokens de `_tokens.scss` y breakpoints de `_breakpoints.scss`.
- Reutiliza `AppPageHeader`, `AppCard`, diálogos, empty states y composiciones financieras.
- Prefiere primitivas Quasar cuando ya proporcionen el comportamiento requerido.
- Mantén los mismos roles semánticos en desktop y mobile; adapta estructura y wrapping.
- Conserva en el componente la estructura específica de una feature.
- Valida `/design-system`, desktop y anchos móviles cuando el cambio sea visual.

## Metodología

Para un cambio pequeño: inspecciona, implementa, valida y actualiza documentación solo si cambia un
contrato. Para un cambio complejo: identifica alcance, dependencias, riesgos y criterios de
aceptación; crea o actualiza un plan persistente si abarcará varias fases o sesiones; implementa y
valida incrementalmente.

No conviertas correcciones pequeñas en procesos burocráticos ni solicites una segunda aprobación para
trabajo ya autorizado. Detente ante una decisión funcional no aprobada, una ampliación de alcance o
una operación sensible.

## Validación y entrega

Selecciona los checks según `docs/TESTING.md`. Para un cambio transversal o visual ejecuta, como
base:

```bash
npm run lint:check
npm test
npm run build
```

Añade `npm run test:rules` cuando cambien autorización, demo o Firestore Rules. No ejecutes el
comando mutante `npm run lint` solo para verificar. Nunca afirmes que una prueba se ejecutó si no se
ejecutó; comunica errores y comprobaciones pendientes.

Actualiza la documentación canónica en el mismo cambio cuando varíen reglas de negocio, fórmulas,
arquitectura, contratos persistidos, permisos, convenciones visuales compartidas o procedimientos.
Usa referencias cruzadas en lugar de duplicar reglas.
