# Acceso, billing y seguridad

## Capas de control

Worthward separa:

1. **Visibilidad:** rutas, botones y gates de la SPA.
2. **Capacidad comercial:** funciones de `functions/shared/billing/entitlements.js`.
3. **Autorización:** Firestore Rules y validaciones de Functions/Admin SDK.

Ocultar una acción nunca sustituye la autorización efectiva.

## Autenticación

Firebase Auth admite email/contraseña y Google. El router espera la resolución de sesión. Las rutas
bajo `/home` requieren autenticación; los tokens de invitación pueden abrir su ruta pública y pedir
login antes de consumirse.

El trial exige además email verificado. No se documentan ni almacenan credenciales o secretos en el
repositorio.

## Membership, roles y ownership

- `memberIds` determina quién pertenece al workspace.
- `members[uid].role` determina owner o member y conserva datos de presentación.
- Solo owner puede crear invitaciones o ejecutar operaciones reservadas.
- Ownership financiero reparte importes; no concede membership ni permisos.

Las consultas de workspaces usan `memberIds array-contains`. Una entrada en `members` sin
`memberIds` no autoriza acceso.

## Matriz de capacidades

| Capacidad                                    | Free                      | Pro                       |
| -------------------------------------------- | ------------------------- | ------------------------- |
| Primer workspace editable                    | Sí                        | Sí                        |
| Workspaces adicionales                       | No                        | Sí                        |
| Escritura financiera ordinaria               | Sí                        | Sí                        |
| Plan y What If                               | Sí                        | Sí                        |
| Strategy                                     | No                        | Sí                        |
| Modelos Cash, inmueble, hipoteca y portfolio | No                        | Sí                        |
| Invitar miembros                             | No                        | Owner, máximo 5 miembros  |
| Miembro invitado                             | Hereda tier del workspace | Hereda tier del workspace |

Los miembros invitados no adquieren Pro para su cuenta ni para otros workspaces.

## Cuenta, workspace y entitlement

`users/{uid}/private/subscription` representa la cuenta y su compra. El backend combina suscripción y
trial para resolver el entitlement efectivo. Cada workspace propio guarda una proyección mínima:
`tier` y `expiresAt`.

Las operaciones dentro de un workspace usan esa proyección, permitiendo que los invitados hereden
capacidades sin leer datos privados del owner. La expiración se evalúa contra el reloj; un documento
con `tier: pro` vencido no concede acceso.

El cliente solo puede leer su suscripción/trial. Todas las escrituras pertenecen a Functions.

## Google Play

Producto estable: `worthward_pro`; base plan actual: `annual`.

`verifyGooglePlaySubscription` valida purchase token, producto, paquete, cuenta ofuscada y estado con
Google Play. Evita asignar un token a dos cuentas, persiste `billingPurchases` y proyecta entitlement
en los workspaces del owner. `reconcileGooglePlaySubscriptions` repite la reconciliación de forma
programada.

El cliente nunca concede Pro basándose únicamente en el resultado local de compra.

## Trial promocional

- duración: 30 días;
- activación manual y una vez por cuenta;
- requiere autenticación y email verificado;
- no se inicia si ya existe un Pro no procedente del trial;
- una activación repetida durante el trial es idempotente;
- al crearse, proyecta Pro sobre workspaces propios activos;
- al expirar, permanece consumido y no elegible;
- el aviso final se reclama una sola vez mediante callable.

La suscripción pagada tiene prioridad sobre un trial activo sin borrar su historia.

## Pérdida de Pro

Comportamiento implementado:

- no elimina workspaces, miembros ni datos;
- mantiene lectura y escritura financiera ordinaria para miembros;
- bloquea nuevos workspaces adicionales e invitaciones;
- bloquea Strategy y nuevas mutaciones de modelos avanzados;
- recuperar Pro reactiva capacidades sin migrar datos.

La visión histórica describía solo lectura para algunos workspaces. No está implementado; consulta
la decisión pendiente en [DECISIONS.md](DECISIONS.md).

## Firestore Rules

Rules permite:

- preferencias propias con whitelist de campos;
- lectura de workspaces por membership y lectura autenticada del demo;
- lectura de modelos y años por membership/demo;
- tracking y achievements para miembros de workspace activo;
- What If para miembros;
- Strategy solo con entitlement Pro no expirado.

Rules deniega:

- escritura cliente de modelos fuente y `financialYears`;
- acceso cliente a invitaciones y compras;
- escritura en el demo;
- acceso no contemplado mediante fallback final.

Rules no replica todo el schema financiero. Functions valida relaciones, atomicidad, modelos
avanzados y operaciones privilegiadas.

## Demo

`worthward_demo` es un workspace reservado:

- cualquier usuario autenticado puede leer el árbol soportado;
- no requiere membership ordinaria;
- no aparece como workspace real ni cuenta para límites;
- su selección es de sesión y no se guarda en preferencias;
- proyecta visibilidad contextual Pro sin modificar la cuenta;
- todas las escrituras se bloquean en UI, servicios, Rules y Admin SDK;
- triggers, schedules y mantenimiento automático lo omiten;
- What If y Strategy se pueden explorar en memoria, sin persistencia.

El procedimiento operativo está en [operations/DEMO.md](operations/DEMO.md).

## Revisión de seguridad

Cuando cambie una operación:

1. identifica quién puede leer, escribir y ver;
2. diferencia owner, member, no miembro, demo, Free y Pro;
3. revisa cliente, Rules y Functions;
4. confirma que datos del cliente no conceden derechos;
5. añade tests unitarios y, si intervienen Rules, `npm run test:rules`;
6. prueba expiración y conservación de datos.
