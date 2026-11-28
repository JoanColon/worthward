# Producto Worthward

## Estado del documento

Referencia funcional vigente. Describe el producto implementado y sus principios aprobados; no es
un inventario de cada pantalla. Las propuestas anteriores se conservan en
[`archive/PRODUCT_VISION-legacy.md`](archive/PRODUCT_VISION-legacy.md) como historia no normativa.

## Propósito y posicionamiento

Worthward es un **Personal Finance Workspace**, no un tracker contable. Ayuda a responder:

1. ¿Qué poseo y qué debo?
2. ¿Cuánto cuesta realmente mi vida?
3. ¿Qué capacidad de ahorro tengo?
4. ¿Cómo afectan mis decisiones a mi futuro?
5. ¿Qué progreso estoy haciendo?

Su ciclo de aprendizaje es `Estimate -> Track -> Confirm -> Learn`. El producto debe seguir siendo
útil sin registrar cada transacción: el modelo financiero estimado es la base y el tracking mejora
su precisión.

## Principios funcionales

### Cost of Life

Cost of Life es la medida central de gastos. Se deriva de las definiciones y calendarios de gasto;
no debe existir un total anual manual paralelo. Alimenta capacidad de ahorro, seguridad financiera,
simulaciones, estrategia y progreso.

### Posiciones, flujos y tracking

- Activos y pasivos son posiciones observadas en un mes.
- Ingresos y gastos son flujos distribuidos en el calendario anual.
- Expense Tracker registra gasto real por periodo sin sustituir el modelo estimado.
- Reconciliar confirma o ajusta el modelo; no debe contabilizar dos veces un mismo gasto.
- Invertir o transferir dinero no es Cost of Life.

Las fórmulas e invariantes se detallan en [FINANCIAL_ENGINE.md](FINANCIAL_ENGINE.md).

### Datos fuente y derivados

Los documentos de modelo son editables. `financialYears` es una vista materializada que conserva el
detalle mensual y el historial: el año actual se actualiza desde el modelo, mientras los periodos
cerrados preservan su estado. Las simulaciones guardan inputs y configuración, no sus resultados.

## Workspaces y colaboración

Un usuario puede pertenecer a varios workspaces. Cada workspace representa una economía personal o
compartida y toda lectura financiera se limita a él.

- `memberIds` determina membership.
- `members` conserva rol y perfil del miembro.
- El owner administra invitaciones y configuración sensible.
- Cada importe puede asignarse al conjunto o repartirse porcentualmente entre miembros.
- El scope de lectura permite ver el total o la participación de un miembro.

La autorización y las capacidades se documentan en [ACCESS_CONTROL.md](ACCESS_CONTROL.md).

## Módulos actuales

- **Home / Financial Position:** resumen de activos, pasivos, ingresos y Cost of Life.
- **Assets:** Cash, inversiones, inmuebles, vehículos y otros activos.
- **Liabilities:** hipotecas, préstamos y otras deudas.
- **Income:** salarios y otros ingresos, incluidos porcentajes disponibles o reinvertidos.
- **Expenses:** modelo de gastos y clasificaciones financieras.
- **Expense Tracker:** registro mensual y reconciliación.
- **Plan / What If:** reducción discrecional y ahorro adicional; disponible en Free.
- **Your Strategy:** asignación futura entre Cash, inversión y deuda; requiere Pro.
- **Progress:** historia financiera, métricas y milestones.
- **Worthward Learn:** contenido contextual en Cash, inversiones e hipotecas; no es una academia
  independiente ni aparece en todas las rutas.
- **Pro:** compra, restauración, trial y estado de entitlement.
- **Demo:** workspace común de solo lectura con datos ficticios.

## Experiencia

La experiencia debe ser calmada, legible y centrada en magnitudes financieras. La navegación
principal prioriza posición, gastos, plan y progreso; configuración y cuenta permanecen fuera del
flujo principal.

No existe un wizard obligatorio. Si una cuenta todavía no tiene workspaces, `WelcomeEntry` ofrece
explorar el demo o crear uno. Después, las pantallas permiten completar el modelo progresivamente.
Los estados vacíos deben orientar sin bloquear el acceso al producto.

## Free y Pro

Free permite un primer workspace, edición financiera ordinaria, Plan y What If. Pro habilita
workspaces adicionales, colaboración mediante invitaciones, Strategy y modelos avanzados. Los
miembros heredan las capacidades Pro del workspace, pero solo el owner puede invitar.

La pérdida de Pro no elimina datos. La implementación actual conserva las escrituras ordinarias y
bloquea nuevas capacidades Pro. La propuesta histórica de convertir ciertos workspaces en solo
lectura no está implementada y figura como decisión pendiente en [DECISIONS.md](DECISIONS.md).

## Límites vigentes

- La UI solo ofrece `en-US`.
- El cambio de moneda modifica unidad y formato; no convierte importes.
- Google Sheets usa un enlace accesible y Google GViz, no OAuth.
- La SPA web usa rutas hash.
- Android es la plataforma nativa activa; iOS no forma parte de la implementación actual.
- Los dominios públicos finales siguen pendientes de la migración operativa de marca.
