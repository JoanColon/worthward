# Registro de decisiones

Este registro conserva decisiones que afectan a varias áreas. El código muestra el comportamiento;
cuando la justificación histórica no está documentada se indica expresamente. Los planes temporales
no sustituyen este registro.

## Decisiones vigentes

### D-001 — Arquitectura por workspaces

- **Estado:** aceptada e implementada.
- **Decisión:** toda información financiera se limita a un workspace; `memberIds` concede membership
  y `members` conserva rol/perfil.
- **Consecuencia:** todas las consultas, caches, listeners y mutaciones necesitan `workspaceId`.
- **Evidencia:** `firestore.rules`, `workspace.service.js`, `functions/features/workspaces/`.

### D-002 — Motor financiero compartido

- **Estado:** aceptada e implementada.
- **Decisión:** reglas portables viven en `functions/shared/` y no dependen de Firebase o Vue.
- **Justificación:** evita divergencias entre SPA y backend; no se conserva una justificación
  histórica más específica.
- **Consecuencia:** pages/stores no son ubicación válida para una fórmula canónica.

### D-003 — Separar modelo, tracking y proyección

- **Estado:** aceptada e implementada.
- **Decisión:** documentos `model*` son fuentes editables, `expenseTracking` conserva observaciones y
  `financialYears` materializa el año y la historia.
- **Consecuencia:** reconciliar no elimina tracking ni crea una segunda fuente de Cost of Life.

### D-004 — Preservar periodos financieros cerrados

- **Estado:** aceptada e implementada.
- **Decisión:** posiciones cerradas no se recalculan desde el modelo actual.
- **Consecuencia:** correcciones históricas requieren una operación explícita, no un rebuild casual.

### D-005 — Mutación atómica del modelo

- **Estado:** aceptada e implementada.
- **Decisión:** activos, pasivos, ingresos y gastos se mutan mediante callable junto con la proyección
  afectada.
- **Consecuencia:** Rules bloquea su escritura directa desde cliente.

### D-006 — Google Sheets sin OAuth

- **Estado:** aceptada e implementada.
- **Decisión:** portfolios usan un enlace accesible y consultas GViz.
- **Consecuencia:** la hoja debe cumplir nombres/columnas y ser legible por enlace; no hay acceso a
  hojas privadas mediante OAuth.

### D-007 — Demo compartido de solo lectura

- **Estado:** aceptada e implementada.
- **Decisión:** `worthward_demo` es legible por cualquier usuario autenticado, no requiere membership
  y no admite persistencia.
- **Consecuencia:** cliente, Rules, Functions, triggers y schedules deben proteger el ID reservado.

### D-008 — Separar suscripción de cuenta y entitlement de workspace

- **Estado:** aceptada e implementada.
- **Decisión:** la cuenta conserva proveedor/trial; el workspace almacena una proyección mínima del
  owner que heredan sus miembros.
- **Consecuencia:** un invitado puede usar Pro dentro del workspace sin adquirirlo en su cuenta.

### D-009 — What If Free y Strategy Pro

- **Estado:** aceptada e implementada.
- **Decisión:** Plan y What If están disponibles en Free; Strategy y modelos avanzados requieren Pro.
- **Consecuencia:** configuración y autorización de ambos escenarios permanecen separadas.

### D-010 — Identificadores técnicos estables durante el rebrand

- **Estado:** aceptada.
- **Decisión:** Worthward es la marca comercial, pero IDs técnicos existentes se conservan cuando
  cambiarlos rompería Firebase, Android, billing o datos.
- **Consecuencia:** la migración de dominios no autoriza renombrar package IDs, proyectos o claves
  persistidas. Consulta `operations/BRAND_MIGRATION.md`.

## Decisiones pendientes

### P-001 — Comportamiento completo al perder Pro

- **Implementado:** datos conservados, escritura ordinaria permitida y capacidades avanzadas
  bloqueadas.
- **Requisito histórico:** workspaces adicionales y compartidos del owner pasarían a solo lectura.
- **Implicación:** adoptar el requisito histórico exige cambiar capacidades, UX, Rules/Functions y
  tests; no es una corrección documental.
- **Estado:** pendiente de confirmación funcional. Hasta entonces, la documentación operativa refleja
  la implementación.

### P-002 — Gestor de paquetes raíz

- **Estado actual:** existen `yarn.lock` y `package-lock.json`; la convención histórica instala SPA y
  Capacitor con Yarn, y Functions con npm.
- **Implicación:** regenerar ambos puede producir dependencias distintas.
- **Estado:** pendiente de elegir un único lockfile raíz. No resolver dentro de tareas ajenas.

### P-003 — Roadmap vigente

- **Estado actual:** el documento histórico mezcla fases completadas, propuestas obsoletas y trabajo
  potencial.
- **Decisión pendiente:** identificar compromisos futuros reales antes de crear `ROADMAP.md`.
- **Consecuencia:** el repositorio no presenta propuestas antiguas como roadmap activo.
