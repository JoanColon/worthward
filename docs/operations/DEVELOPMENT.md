# Desarrollo local

## Requisitos

- Node.js `^22.12`, `^24` o `>=26`.
- Yarn Classic para SPA y `src-capacitor/` según la convención vigente.
- npm para `functions/`.
- Firebase CLI para emuladores.
- Chrome para Google Auth web.
- Java 21, Android Studio y SDK 36 para Android.

`.java-version` fija Java 21 para herramientas compatibles.

## Instalación

```bash
yarn install --frozen-lockfile
yarn --cwd src-capacitor install --frozen-lockfile
npm --prefix functions ci
```

La raíz contiene dos lockfiles. No los regeneres ni elimines hasta resolver P-002 en
[`../DECISIONS.md`](../DECISIONS.md).

## SPA conectada a Firebase configurado

```bash
yarn dev
```

La configuración pública del SDK vive en `src/firebase/firebase.js`. `VITE_APP_URL` es opcional para
el origen de invitaciones en Capacitor. Un arranque normal no usa emuladores.

## Emuladores integrados

Terminal 1:

```bash
npm run emulators:start
```

Terminal 2, opcionalmente carga el demo:

```bash
npm run emulators:seed-demo -- --input /ruta/al/fixture.json
```

Terminal 3:

```bash
npm run dev:emulators
```

Ese script activa `VITE_USE_FIREBASE_EMULATORS=true` y usa `worthward-local`. El SDK conecta Auth
9099, Firestore 8080 y Functions 5001 en `127.0.0.1`. Solo se permite en desarrollo web; Capacitor
queda excluido.

La UI de emuladores usa el puerto 4000. Los datos en memoria desaparecen al detener la suite si no
se configura import/export.

## Validación ordinaria

```bash
npm run lint:check
npm test
npm run build
```

Usa `npm run test:rules` para autorización/demo. Consulta [`../TESTING.md`](../TESTING.md) para
seleccionar checks proporcionales.

## Android local

```bash
npm run android:dev
npm run android:sync
```

Confirma `java -version` antes de Gradle. No modifiques archivos generados en `android/build`,
`app/build`, `src-capacitor/www` o caches para resolver una tarea de código fuente.
