# Migración de identidad a Worthward

## Estado

Worthward es la identidad comercial de la aplicación. La migración conserva el proyecto Firebase, los datos, los contratos persistidos y los identificadores de las aplicaciones ya registradas.

La configuración de marca vive en dos puntos deliberadamente independientes:

- `src/config/brand.js` para la SPA Quasar;
- `landing/src/config/brand.js` para la landing Vite SSG.

Ambas utilizan `VITE_APP_URL` cuando está definida y mantienen como fallback operativo `https://cost-of-life-f23b2.web.app`. La landing de producción fija actualmente ese mismo origen en `landing/.env.production`.

## Referencias conservadas

### Conceptos financieros

`Cost of Life`, `costOfLife`, `annualCostOfLife`, `CostOfLifeCard` y variantes equivalentes se mantienen cuando representan el coste de vida calculado. Forman parte del lenguaje financiero, de cálculos, tests, rutas internas y contratos de datos.

### Identificadores técnicos

Se mantienen sin cambios:

- proyecto Firebase `cost-of-life-f23b2` y todos sus valores de configuración;
- targets de Hosting `cost-of-life-f23b2` y `worthward-landing`;
- Android application ID, namespace y esquema `com.worthward.app`;
- identificador de Electron reservado `cost-of-life`;
- host de App Links `cost-of-life-f23b2.web.app`;
- producto de suscripción `worthward_pro` y base plan `annual`;
- nombres de Functions, rutas, colecciones, campos e IDs persistidos.

## Acciones manuales pendientes

1. Configurar `worthward.com` en el target de Hosting de la landing y `app.worthward.com` en el target de la SPA.
2. Añadir ambos dominios a Firebase Authentication y revisar los orígenes/redirecciones autorizados de Google OAuth.
3. Tras comprobar propagación TLS y Auth, cambiar `VITE_APP_URL` a `https://app.worthward.com` en los entornos de producción correspondientes.
4. Añadir `app.worthward.com` como host adicional de App Links en Android, publicar su `/.well-known/assetlinks.json` y conservar el host Firebase durante la transición.
5. Revisar los enlaces de login/registro de la landing frente al router `hash` de la SPA antes de activar los dominios nuevos.
6. Actualizar el nombre visible y la ficha comercial en Google Play. El package estable es `com.worthward.app` y no debe cambiarse por una actualización de marca.
7. Si se incorpora iOS, configurar `CFBundleDisplayName` como `Worthward` sin cambiar el Bundle Identifier registrado.
8. Sustituir los favicon, iconos de launcher y splash genéricos de Quasar/Capacitor por recursos oficiales de Worthward. No se generaron recursos ficticios durante esta migración.
9. Sustituir `hello@example.com` en la landing por la dirección oficial de soporte.

No se deben activar redirecciones definitivas hacia los dominios nuevos hasta completar conjuntamente Hosting, Authentication, OAuth y App Links.
