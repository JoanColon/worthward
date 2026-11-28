# Operación del demo

El contrato de seguridad del demo está en [`../ACCESS_CONTROL.md`](../ACCESS_CONTROL.md). Este
documento cubre validación y seed. La evidencia de la carga de 2026-11-27 está archivada en
[`../archive/demo-firestore-validation-2026-11-27.md`](../archive/demo-firestore-validation-2026-11-27.md).

## Fixture

El seed acepta un JSON con documentos bajo `workspaces/worthward_demo`. El script:

- valida rutas y estructura conocida;
- normaliza marcadores de timestamp;
- adapta el scenario demo estable cuando corresponde;
- es create-only por defecto;
- exige `--allow-overwrite` para reemplazar datos;
- rechaza producción salvo autorización técnica explícita adicional.

La existencia de flags de producción no constituye aprobación para usarlos.

## Validación en seco

```bash
npm --prefix functions run seed:demo -- \
  --input /ruta/al/fixture.json \
  --dry-run
```

Revisa número de documentos, rutas, correcciones y warnings antes de escribir.

## Seed y preview local

1. Arranca emuladores:

   ```bash
   npm run emulators:start
   ```

2. Carga el fixture:

   ```bash
   npm run emulators:seed-demo -- --input /ruta/al/fixture.json
   ```

3. Arranca la SPA conectada:

   ```bash
   npm run dev:emulators
   ```

4. Crea un usuario en Auth Emulator y valida:

   - el demo aparece sin membership ordinaria;
   - All y scopes de miembros muestran datos coherentes;
   - Setup y acciones persistentes no están disponibles;
   - What If/Strategy cambian solo en memoria;
   - recargar restaura el fixture;
   - las escrituras son rechazadas.

## Checks automatizados

```bash
npm test
npm run test:rules
npm run lint:check
npm run build
```

Incluye tests del ID reservado, servicios Admin SDK, store financiero, portfolio y reglas de lectura/
escritura. Un gate de UI no basta para considerar protegido el demo.

## Producción

Una carga o sustitución en producción requiere autorización explícita para ese proyecto, revisión del
dry-run, Rules/Functions desplegadas y smoke test posterior. Usa IDs de proyecto literales y evita
variables o defaults ambiguos. El seed no debe sobrescribir un demo existente salvo aprobación
específica y backup/plan de recuperación.
