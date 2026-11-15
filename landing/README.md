# Worthward landing — static SSG

Vue 3 + Quasar components + Vite + vite-ssg. JavaScript only.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

`npm run build` prerenders every route listed in `src/router/index.js` into `dist/`, including `/`, `/how-to/`, `/learn/`, `/pricing/`, `/how-to/getting-started/`, and `/learn/net-worth/`.

Add new guide pages to the route table; keep content static and accessible at build time. `ContentPage.vue` currently provides starter text, not finished tutorials. Update titles/descriptions per page.

Configure `VITE_APP_URL` (see `.env.example`) for links to the separate application. **Do not put secrets in VITE_ variables.**

## Firebase Hosting

Use a second Hosting site/target in the existing Firebase project. Hosting `public` must be `landing/dist` when this directory is checked out as `landing/` in the main repo. Preserve existing functions and Firestore configuration. Deploy only the landing target with `firebase deploy --only hosting:landing`.

The site is fully static: no Firebase SDK or server is needed. The prerendered pages contain real HTML for SEO. Route fallback to `/index.html` can be configured for unknown client-side paths, but the known static routes are emitted as HTML files.
