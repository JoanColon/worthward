# Motor financiero

## Contrato general

La lógica portable vive principalmente en `functions/shared/`; `src/domain/financial/` adapta o
compone reglas para la SPA. Las funciones deben ser deterministas, testeables y no depender de Vue,
Firebase ni estado remoto. `functions/shared/README.md` define la dirección de dependencias.

No se debe implementar una segunda fórmula en componentes, stores o Functions. Cuando una métrica
necesite frontend y backend, su implementación canónica pertenece al motor compartido.

## Precisión y scope

`functions/shared/core/money.js` centraliza normalización y redondeo monetario. Tasas y fechas tienen
utilidades propias. No redondees antes de lo requerido por el contrato: algunas métricas conservan
precisión interna y redondean únicamente al presentar.

El scope financiero es `all` o un miembro. `core/ownership.js` distribuye importes según ownership;
los agregados deben usar el mismo scope en numerador y denominador.

## Métricas base

Implementación: `functions/shared/positions/metrics.js` y `overview-metrics.js`.

```text
net worth = assets - liabilities
savings capacity = available income - Cost of Life
savings rate = savings capacity / available income
Cost of Life ratio = Cost of Life / available income
safety months = cash / (annual Cost of Life / 12)
funded years = investable wealth / annual Cost of Life
```

Un denominador no positivo produce cero o ausencia según la métrica; conserva el contrato de la
función existente. Net worth compara posiciones de la misma fecha. Investable wealth no incluye
automáticamente todos los activos: usa el selector canónico del dominio.

## Income

Implementación: `functions/shared/income/calculations.js`.

Modelos soportados:

- salario anual con número de pagas;
- calendario mensual y extras por mes;
- ingreso recurrente mensual, trimestral o anual;
- ingreso único en un mes.

El reparto de un importe anual se hace en céntimos y asigna el resto a los primeros meses para que
los doce meses sumen exactamente el anual. `disposableIncomePercent` indica la parte disponible para
el hogar; la diferencia es ingreso reinvertido. Available income, no income bruto, alimenta savings
capacity.

## Expenses y Cost of Life

Implementación: `functions/shared/expenses/calculations.js`.

Frecuencias: mensual, bimestral, trimestral, anual e irregular. Los modelos recurrentes se expanden
a doce meses; los overrides explícitos se conservan al cambiar una estimación cuando ya no coinciden
con el baseline anterior.

Clasificaciones actuales:

- variabilidad: `fixed` o `variable`;
- recurrencia: `recurring` u `occasional`;
- necesidad: `essential`, `lifestyle` o sin clasificar.

Cost of Life es la suma de los flujos de gasto del periodo y no un campo editable paralelo.
Mandatory/discretionary se presenta mediante las clasificaciones disponibles; no inventes una
equivalencia distinta si el código usa `essential/lifestyle`.

## Posiciones y año financiero

Implementación: `functions/shared/positions/annual-projection.js`,
`functions/features/financial-years/` y `financial-years-store.js`.

- Assets y liabilities son posiciones observadas.
- Income y expenses son flujos.
- El año actual materializa doce meses desde los documentos fuente.
- Actualizar una fuente recompone solo secciones y meses permitidos.
- Una posición mensual cerrada no se sobrescribe.
- Años anteriores se consideran historia cerrada.

Dashboard, Progress, Plan y milestones dependen de esta vista. Un cambio de fuente no está completo
si el documento fuente cambia pero `financialYears` queda incoherente.

## Expense Tracker y reconciliación

Implementación: `functions/shared/expenses/reconciliation.js`,
`src/domain/financial/expense-tracking.js` y servicios/stores de tracking.

El tracking registra gasto observado por mes. La reconciliación compara el periodo registrado con
el modelo y puede actualizar la estimación; no convierte automáticamente toda transacción en un
nuevo gasto de modelo. Un pago relacionado con un gasto existente lo confirma, no lo duplica.

Preserva por separado:

- estimación del modelo;
- importes registrados;
- estado de reconciliación;
- proyección anual resultante.

## Cash

Implementación: `functions/shared/assets/cash.js` y adaptadores de la UI.

El modelo Cash guarda una rentabilidad anual opcional para proyecciones. `currentValue` continúa
siendo una posición observada: la proyección nunca debe escribir de vuelta rendimientos hipotéticos
como saldo real.

## Inmueble y equity

Implementación: `functions/shared/assets/real-estate.js` y `real-estate-projection.js`.

La valoración usa precio/fecha de compra y apreciación anual según el schema existente. Equity es
valor efectivo del inmueble menos principal hipotecario relacionado. Evita restar dos veces una
hipoteca: ya forma parte de liabilities para net worth.

## Hipoteca

Implementación: `functions/shared/liabilities/mortgage.js` y
`src/domain/financial/mortgage-liability-adapter.js`.

El modelo usa amortización francesa con principal, tipo, plazo, fecha y cuota. La tabla separa
interés y principal; el saldo no puede ser negativo. Una hipoteca puede vincularse a un inmueble y a
un gasto, pero balance de deuda, pago y Cost of Life representan conceptos distintos.

Los tests canónicos viven en `mortgage-amortization.test.js`, `shared-mortgage-semantics.test.js`,
`mortgage-domain.test.js` y tests de servicios financieros.

## Portfolio y dividendos

Implementación: `functions/features/investment-portfolios/`,
`functions/shared/assets/securities.js` y `src/domain/financial/investment-portfolio.js`.

La Function descarga y normaliza Portfolio, Summary y Dividends. El cache v3 contiene holdings,
dividendos, summary, warnings y tiempos numéricos de refresco. La valoración sincronizada puede
actualizar la posición; los dividendos históricos alimentan sus métricas sin convertirse en una
segunda posición de activo.

## What If

Implementación: `functions/shared/plan/what-if.js`.

What If aplica reducción de gasto discrecional y ahorro mensual adicional a un contexto financiero
existente. Devuelve comparaciones de Cost of Life, savings capacity e inversión para horizontes
soportados. Persiste inputs en `modelConfig/whatIf`; los resultados se recalculan.

Es una capacidad Free. No añadas una comprobación Pro a su cálculo o persistencia.

## Your Strategy

Implementación: `functions/shared/plan/strategy-simulation.js` y `debt-payoff.js`.

Strategy distribuye capacidad de ahorro entre Cash, inversión y amortización de deuda según pesos,
colchón objetivo, rentabilidades, inflación, horizonte y deuda seleccionada. Conserva una distinción
entre aportaciones, crecimiento, deuda amortizada y valor inmobiliario.

El momento en que se alcanza una milestone se obtiene del primer punto que cumple el umbral; no es
equivalente al resultado final de la simulación. Strategy requiere Pro y solo persiste configuración.

## Progress y milestones

Implementación: `functions/shared/progress/metrics.js`, `functions/shared/milestones/definitions.js`,
`src/domain/milestones/` y `milestones-store.js`.

Progress deriva series de `financialYears`. Los milestones tienen IDs y thresholds estables. Al
activar tracking, logros ya cumplidos pueden registrarse como achieved; después, una nueva
calificación pasa por pending antes de confirmarse. Si deja de cumplirse, el estado se retira según
el contrato actual.

## Checklist para cambiar una fórmula

1. Identifica implementación y tests canónicos.
2. Confirma significado financiero, unidad, periodo, scope y política de redondeo.
3. Evalúa doble contabilización y datos históricos.
4. Revisa fuente, proyección, Dashboard, Progress, Plan y milestones.
5. Añade tests de bordes: cero, negativo, división, fechas, ownership y periodos cerrados.
6. Actualiza este documento y [DECISIONS.md](DECISIONS.md) si cambia una regla aprobada.
