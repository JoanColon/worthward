# Despliegue

Este documento describe comandos; no concede autorización para ejecutarlos. Antes de desplegar,
confirma el proyecto activo, credenciales, diff, checks y alcance solicitado.

## Preflight

```bash
npm run lint:check
npm test
npm run build
```

Añade `npm run test:rules` si cambian Rules, demo o permisos. Revisa `.firebaserc`, targets de
Hosting y región `europe-west1`.

## Hosting

La SPA se genera en `dist/spa` y la landing en `landing/dist`. `firebase.json` define targets
separados `app` y `landing`.

```bash
npm run build
firebase deploy --only hosting
```

Si solo corresponde un target, usa un deploy explícitamente limitado según la configuración activa.

## Firestore

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Ejecuta primero tests de Rules cuando cambie autorización. Un deploy de Rules puede afectar de
inmediato a clientes existentes.

## Cloud Functions

```bash
npm --prefix functions run deploy
```

El predeploy ejecuta lint de Functions. Revisa exports en `functions/index.js`, secretos/configuración
del entorno y compatibilidad con Node 24. No despliegues Functions no relacionadas para resolver un
problema local sin evaluar impacto.

## Android

```bash
npm run android:sync
npm run android:build
npm run android:bundle
```

Requisitos: Java 21, Android SDK 36 y firma/configuración de release disponible fuera de la
documentación. El package estable es `com.worthward.app`. La compra usa `worthward_pro` y base plan
`annual`; no cambies esos IDs como parte de una migración visual de marca.

## Después del despliegue

- verifica autenticación y selección de workspace;
- comprueba una lectura y una mutación autorizada;
- confirma rechazo de una operación no autorizada;
- revisa demo y capacidades Free/Pro si fueron afectadas;
- confirma logs y ausencia de errores nuevos;
- documenta qué se desplegó y qué smoke tests se realizaron.

No ejecutes seeds de producción, migraciones destructivas ni rollouts comerciales sin autorización
específica adicional.
