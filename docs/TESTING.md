# Validación y testing

## Herramientas

- Vitest para dominio, stores, servicios, router y lógica de Functions.
- `@firebase/rules-unit-testing` y Firestore Emulator para Rules.
- ESLint y Prettier para calidad estática.
- Quasar/Vite para build SPA.
- Emuladores integrados para Auth, Firestore y Functions.
- Comprobación manual para responsive, accesibilidad e integraciones externas.

Los tests reflejan las capas del código bajo `test/domain`, `test/stores`, `test/services`,
`test/functions`, `test/router`, `test/security`, `test/learn` y `test/utils`.

## Comandos

```bash
npm test
npm run lint:check
npm run build
npm run test:rules
```

`npm run lint` reescribe archivos y no debe usarse para una verificación de solo lectura.

Para entorno integrado:

```bash
npm run emulators:start
npm run emulators:seed-demo -- --input PATH
npm run dev:emulators
```

La SPA solo conecta a emuladores cuando `VITE_USE_FIREBASE_EMULATORS=true`, en desarrollo web y no
en Capacitor. El project ID local predeterminado es `worthward-local`.

## Matriz por tipo de cambio

| Cambio             | Validación mínima                                            |
| ------------------ | ------------------------------------------------------------ |
| Documentación      | links/rutas, comandos, Prettier Markdown y diff              |
| Dominio financiero | tests focalizados, suite completa, lint                      |
| Store o servicio   | tests de estado/error/reset y suite completa                 |
| Function           | tests del service, exports, lint y build si afecta cliente   |
| Firestore o acceso | tests de capacidades, `test:rules`, escenarios negativos     |
| UI                 | lint, tests, build y comprobación manual desktop/mobile      |
| Datos persistidos  | lectores/escritores, compatibilidad, Rules y tests de schema |
| Android            | build/sync específico cuando cambie Capacitor o Gradle       |
| Demo               | seed limpio, lectura autenticada y rechazo de escrituras     |

## Cobertura financiera crítica

Comprueba, según el cambio:

- precisión monetaria y redondeo;
- cero, negativos, valores ausentes y divisiones;
- ownership total y por miembro;
- periodicidad y distribución exacta por meses;
- periodos abiertos frente a cerrados;
- documento fuente y proyección anual;
- prevención de doble contabilización;
- What If frente a Strategy;
- momento de milestone frente a resultado final;
- hipoteca, inmueble y deuda relacionada.

Los tests canónicos se localizan por dominio en `test/domain/financial/` y para materialización en
`test/functions/financial-year*.test.js` y `financial-model-service.test.js`.

## Seguridad y capacidades

La matriz debe cubrir al menos:

- owner/member/no miembro;
- Free/Pro/expirado/trial;
- primer workspace y workspaces adicionales;
- demo autenticado y no autenticado;
- What If Free y Strategy Pro;
- escritura ordinaria y modelos avanzados;
- intento de concederse entitlement desde cliente.

Los tests unitarios de capacidades no reemplazan `test/security/firestore-demo.rules.test.js` cuando
cambian Rules.

## Validación visual

No existe una suite de regresión visual. Para cambios de UI revisa:

- anchos aproximados 360, 390, 768, 1024 y 1440 px;
- foco de teclado y labels accesibles;
- loading, disabled, error y empty states;
- scroll y footer de diálogos;
- valores largos, negativos y scopes por miembro;
- `/design-system` en desarrollo.

No afirmes equivalencia visual exacta sin comparar capturas.

## Resultado de una entrega

Informa los comandos realmente ejecutados y su resultado. Si un check no se ejecutó, explica por
qué. No ocultes skips, dependencia de credenciales, limitaciones del emulador o pruebas manuales
pendientes.

Las cifras históricas de una ejecución no pertenecen aquí; deben archivarse con fecha, como
[`archive/demo-firestore-validation-2026-11-27.md`](archive/demo-firestore-validation-2026-11-27.md).
