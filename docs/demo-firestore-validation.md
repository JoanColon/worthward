# Firestore demo fixture validation

Validated on 2026-11-27 against the current repository using the supplied
`worthward-demo-10y.json` and `README-demo-10y.md`. The referenced generator was not supplied and
was not recreated. After emulator validation and a user-confirmed deployment, the fixture was
seeded into the production project on 2026-11-27 with explicit project-scoped authorization.

## Result

The fixture is structurally compatible with the current financial models after timestamp marker
normalization. Its 65 documents are all below `workspaces/worthward_demo`, and its largest document
is about 171 KB as JSON, comfortably below Firestore's 1 MiB document limit.

The repository implements the shared authenticated read-only workspace protections described
below. The user confirmed completion of the rules, Functions, and application deployment before
the 65 production documents were created under `workspaces/worthward_demo`.

### Implementation status

- `worthward_demo` is centralized as the single reserved workspace ID with reference date
  `2026-11-26`, financial year `2026`, and observed month `11`.
- authenticated clients can read only the supported demo document tree; all client writes are
  denied by Firestore rules;
- Admin SDK financial, portfolio, workspace, entitlement, schedule, and trigger mutation paths
  reject or skip the reserved ID;
- the client discovers the demo separately from membership, keeps its selection session-local,
  does not count it as a real workspace, and projects contextual Pro visibility without changing
  the user's subscription;
- automatic financial-year, portfolio, and milestone maintenance is disabled for the demo;
- portfolio cache v3 renders without a spreadsheet connection, while What If and Strategy changes
  remain in memory; and
- persistent setup, model editing, tracking reconciliation, portfolio connection, membership, and
  workspace actions are hidden, disabled, redirected, and still rejected at service boundaries.

### Validated fixture inventory

| Area             | Result                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace        | One `worthward_demo` document; `members` is a map and `memberIds` contains only the two fictional display identities.                                               |
| Model documents  | 8 assets, 2 liabilities, 3 income items, and 21 expenses use current persisted field names and numeric types.                                                       |
| Categories       | Every asset, liability, income, expense, and tracking category/subcategory exists in the current registries.                                                        |
| Ownership        | Every item and configured position category references a fictional workspace member, has unique shares, and sums to 100%.                                           |
| Relationships    | `home` and `mortgage-payment` both reference `home-mortgage`; dividend income references `portfolio`; referenced documents exist and are unique.                    |
| Mortgage         | The engine returns the stored EUR 807.51 payment and EUR 155,790.17 balance at 2026-11-26. The fixed French-amortization v2 model and anchor are canonical.         |
| Real estate      | The engine returns the stored EUR 270,122.11 value at 2026-11-26 from the v2 purchase model.                                                                        |
| Totals           | Source documents plus the configured EUR 1,500 simple asset total EUR 365,622.11; liabilities total EUR 160,590.17; net worth is EUR 205,031.94.                    |
| Financial years  | Ten schema-v1 documents (2017–2026), each with 12 months. 2017–2025 are closed; 2026 has ten closed months, a current November observation, and projected December. |
| History          | Historical position metadata is accepted by the current history selectors. The synthetic historical flows remain illustrative rather than ledger-reconstructed.     |
| Expense tracking | Eleven 2026 tracking documents reconcile exactly: item sums equal category/document totals, and tracked categories match the 2026 financial-year read model.        |
| Portfolio        | Portfolio/cache schema v3, summary, holdings, dividends, weights, and numeric millisecond cache fields match current readers. No sheet ID or URL is present.        |
| Strategy         | `whatIf` and `whatIfStrategies` normalize without changes; the selected mortgage exists.                                                                            |
| Achievements     | Both documents use current milestone IDs, families, statuses, and values. The set is intentionally partial.                                                         |

## Corrected incompatibility

Thirty-three expense-tracking markers contain a one-digit day, for example
`2026-01-3T12:00:00.000Z`. These are not strict ISO-8601 strings and do not round-trip through
`Date#toISOString`.

The seed script corrects only the unambiguous `YYYY-MM-DT...` fixture form to `YYYY-MM-0DT...`
before calling `Timestamp.fromDate`. It rejects every other malformed timestamp marker. Date-only
domain strings and numeric portfolio cache times are left unchanged.

The supplied strategy document also stores its active configured scenario with the reserved ID
`default`. The dashboard uses that ID to represent an untouched, unsaved baseline, so Home would
show the What If fallback instead of the strategy summary. During import, the seed script renames
only that active fixture scenario to `demo-balanced`; its financial assumptions are unchanged.

The supplied portfolio cache contains dividend payments only for 2026. To exercise the historical
dividend chart, the seed script adds deterministic fictional totals for 2022–2025 (€250, €325,
€405, and €495) and updates cumulative gross dividends to €2,056.25. The supplied 2026 payments,
holdings, and €775 forward annual dividend income remain unchanged.

## Seeding utility

The Admin SDK utility is at `functions/scripts/seed-demo.mjs` and is exposed as `seed:demo` in the
Functions package.

Validate without connecting to Firestore:

```sh
npm --prefix functions run seed:demo -- \
  --input /absolute/path/to/worthward-demo-10y.json \
  --project local-demo \
  --dry-run
```

Seed an emulator:

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
npm --prefix functions run seed:demo -- \
  --input /absolute/path/to/worthward-demo-10y.json \
  --project local-demo
```

The utility:

- imports only the top-level `documents` map;
- requires the fixture workspace ID and every document path to resolve under
  `workspaces/worthward_demo`;
- recursively converts exact timestamp marker maps to Admin SDK `Timestamp` values;
- does not call Firebase Auth or Google APIs;
- preflights all target documents and uses create-only writes by default;
- requires `--allow-overwrite` to replace any existing target document; and
- refuses a non-emulator write unless both `--allow-production` and
  `WORTHWARD_DEMO_PRODUCTION_CONFIRM=worthward_demo:<project-id>` authorize the exact project.

Production authorization is an emergency gate, not deployment approval. It was used only after the
user explicitly confirmed the deployment and authorized the production seed for
`cost-of-life-f23b2`.

## Local emulator preview

No deployment is needed to inspect the demo. The repository has an explicit browser development
mode that connects Authentication, Firestore, and Functions to `127.0.0.1` using the isolated
Firebase project ID `worthward-local`. Normal `npm run dev` and production builds do not enable
this mode.

Use three terminals from the repository root.

1. Start the emulator suite and keep it running:

   ```sh
   npm run emulators:start
   ```

   The Emulator Suite UI is available at `http://127.0.0.1:4000`.

2. Seed the fixture after Firestore reports that it is ready:

   ```sh
   npm run emulators:seed-demo -- \
     --input /Users/appledejoan/Downloads/worthward-demo-10y.json
   ```

   The command is create-only. If the demo already exists, stop and restart the emulator suite to
   obtain a clean in-memory database, or explicitly use the seed utility's overwrite option only
   when replacing local emulator data intentionally.

3. Start the browser app in emulator mode:

   ```sh
   npm run dev:emulators
   ```

Open the local URL printed by Quasar and register with any fictional email and a password of at
least six characters. That identity exists only inside the Auth emulator; no real Firebase Auth
user is created. After authentication, the workspace selector loads the shared `Worthward Demo`
workspace without adding that identity as a workspace member.

The emulator data is in memory and is discarded when `npm run emulators:start` stops. Seed again
after each clean restart. Do not run the app with `npm run dev` for this workflow: that command
keeps the normal Firebase project configuration and will not display the locally seeded fixture.

## Implemented protections

### Firestore rules

The reserved-ID predicate makes the access model explicit:

- authenticated users may read the `worthward_demo` workspace and only its required existing
  subcollections;
- no client may create, update, or delete the demo workspace, model config, model items, tracking,
  achievements, or financial years;
- ordinary workspace membership behavior remains unchanged; and
- every write rule, including the workspace `milestoneTracking` update and the recursive model
  match, must include a non-demo condition.

Emulator rule tests cover unauthenticated denial, authenticated demo reads, all demo write verbs,
ordinary member behavior, and ordinary non-member denial. Rules alone do not protect Admin SDK
code, so the backend guards below remain required.

### Workspace discovery, membership, and entitlements

The membership query still uses `memberIds array-contains <uid>`. The client separately loads
`workspaces/worthward_demo` for an authenticated user and appends it to the accessible workspace
list without adding the visitor to `memberIds` or `members`.

Backend access now has an authoritative reserved-ID demo projection: authenticated users receive read and display capabilities,
including the chosen synthetic Pro feature visibility, while all mutation/invite/owner
capabilities stay false. Keep account subscription state unchanged.

Demo selection is session-local. The last real workspace preference is preserved and restored.

### Callable functions and Admin SDK services

The reserved ID is rejected at shared mutation boundaries with service-level defense in depth.
In particular:

- `mutateFinancialModel` must never mutate the demo;
- `ensureFinancialYear` must not rebuild, refresh modeled positions, or close demo months;
- portfolio connect, disconnect, single sync, and workspace sync must reject/skip the demo even if
  demo viewers can see advanced features;
- workspace settings, invitations, membership changes, and deletion must reject the demo; and
- any future Admin SDK mutator must use the same reserved-ID guard.

Do not use `canUseAdvancedModels` as authorization for portfolio writes: demo viewers need feature
visibility but not mutation authority.

### Schedules and triggers

`closeMonthlyFinancialPositions` skips `worthward_demo` before portfolio or financial-year work.

`onModelConfigWritten` and `onExpenseTrackingWritten` return immediately for the reserved ID.

The billing reconciler currently selects owned workspaces by real account identity and should not
match the fictional owner. Still use the reserved-ID mutation guard anywhere workspace entitlement
updates are applied so protection does not depend on synthetic IDs never colliding.

### Client synchronization and read-only UX

The shared predicate and derived read-only capability hide or disable setup, add/edit/delete,
tracking reconciliation, workspace settings, invite, portfolio, and milestone activation controls
in demo context. Firestore and callable enforcement remains authoritative.

The following automatic behavior needs explicit demo branches:

- `financial-years-store` must read the fixture but skip `ensureFinancialYear`;
- `AppLayout` must skip automatic portfolio synchronization;
- the milestones store must load fixture achievements but skip activation, synchronization,
  timers, and resume revalidation; and
- portfolio detail must render schema-v3 cached data directly even though `spreadsheetUrl` is null,
  must ignore cache freshness, and must hide connect/sync/disconnect/template actions.

The fictional tickers are plain text in the current table, so no ticker-link change is required.

### What If and Strategy

The demo uses the same normalization and financial engine with an in-memory store branch: it loads
the fixture baseline, applies changes locally, and resets on workspace exit/reload. Rules and
service guards deny persistence.

## Verification

- `npm run lint:check`: passed.
- `npm test`: 459 passed, with the five emulator-only rule tests skipped in the ordinary unit run.
- `npm run test:rules`: five rule suites passed against the Firestore emulator.
- `npm run build`: passed.
- dry-run validation: 65 documents, four portfolio history years added, one strategy ID
  correction, 33 timestamp corrections, no overwrite authorization.
- clean emulator seed: 65 documents created without `--allow-overwrite` or any production flag.
- the integrated Auth, Firestore, and Functions suite starts under `worthward-local`; an ephemeral
  authenticated emulator identity can read `worthward_demo`, while an attempted model write is
  rejected with `PERMISSION_DENIED`.
- production seed: 65 documents created without overwrite authorization after explicit user
  approval; a production read confirmed the workspace, `demo-balanced` strategy, dividend years
  2022–2026, and €2,056.25 cumulative gross dividends.

## Post-deployment acceptance

- Refresh or sign back into the production application and confirm that `Worthward Demo` appears in
  the workspace selector.
- Repeat the final authenticated browser smoke test in production for All/Alex/Emma, history,
  expense reconciliation, cached portfolio, local simulations, direct setup URL redirection, and
  reload/logout behavior.
