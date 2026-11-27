#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { DEMO_WORKSPACE_ID } from '../shared/workspaces/demo.js'

const PRODUCTION_CONFIRMATION_ENV = 'WORTHWARD_DEMO_PRODUCTION_CONFIRM'

const options = parseArguments(process.argv.slice(2))
const inputPath = resolve(options.input)
const fixture = JSON.parse(await readFile(inputPath, 'utf8'))
const {
  documents,
  portfolioHistoryYearsAdded,
  strategyCorrections,
  timestampCorrections,
} = validateAndConvertFixture(fixture)
const emulatorHost = String(process.env.FIRESTORE_EMULATOR_HOST || '').trim()
const projectId = resolveProjectId(options.projectId)

console.log(
  JSON.stringify(
    {
      mode: options.dryRun ? 'dry-run' : emulatorHost ? 'emulator' : 'production',
      projectId,
      emulatorHost: emulatorHost || null,
      workspaceId: DEMO_WORKSPACE_ID,
      input: inputPath,
      documentCount: documents.length,
      portfolioHistoryYearsAdded,
      strategyCorrections,
      timestampCorrections,
      overwriteAuthorized: options.allowOverwrite,
      dryRun: options.dryRun,
    },
    null,
    2,
  ),
)

if (options.dryRun) process.exit(0)
if (!emulatorHost) assertProductionAuthorization(options, projectId)

const app = initializeApp({
  projectId,
  ...(emulatorHost ? {} : { credential: applicationDefault() }),
})
const firestore = getFirestore(app)
const references = documents.map(([path]) => firestore.doc(path))
const existing = (await firestore.getAll(...references)).filter((snapshot) => snapshot.exists)

if (existing.length && !options.allowOverwrite) {
  throw new Error(
    `Refusing to overwrite ${existing.length} existing document(s): ${existing
      .slice(0, 5)
      .map(({ ref }) => ref.path)
      .join(', ')}${existing.length > 5 ? ', …' : ''}`,
  )
}

const writer = firestore.bulkWriter()
for (const [path, value] of documents) {
  const reference = firestore.doc(path)
  if (options.allowOverwrite) writer.set(reference, value)
  else writer.create(reference, value)
}
await writer.close()

console.log(`Seeded ${documents.length} documents into ${DEMO_WORKSPACE_ID}.`)

function parseArguments(argumentsList) {
  const parsed = {
    input: '',
    projectId: '',
    allowOverwrite: false,
    allowProduction: false,
    dryRun: false,
  }

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === '--input') parsed.input = requireValue(argumentsList, ++index, argument)
    else if (argument === '--project') {
      parsed.projectId = requireValue(argumentsList, ++index, argument)
    } else if (argument === '--allow-overwrite') parsed.allowOverwrite = true
    else if (argument === '--allow-production') parsed.allowProduction = true
    else if (argument === '--dry-run') parsed.dryRun = true
    else if (argument === '--help' || argument === '-h') printHelpAndExit()
    else throw new Error(`Unknown argument: ${argument}`)
  }

  if (!parsed.input) throw new Error('--input is required')
  return parsed
}

function requireValue(argumentsList, index, argument) {
  const value = argumentsList[index]
  if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`)
  return value
}

function printHelpAndExit() {
  console.log(`Usage:
  npm --prefix functions run seed:demo -- --input PATH [options]

Options:
  --project PROJECT_ID       Firebase project ID (required unless available in the environment)
  --dry-run                  Validate and convert the fixture without connecting to Firestore
  --allow-overwrite          Explicitly replace existing reserved demo documents
  --allow-production         First production authorization gate; see environment gate below

Emulator use requires FIRESTORE_EMULATOR_HOST. Production use additionally requires:
  ${PRODUCTION_CONFIRMATION_ENV}=${DEMO_WORKSPACE_ID}:PROJECT_ID
`)
  process.exit(0)
}

function resolveProjectId(explicitProjectId) {
  const projectId =
    explicitProjectId ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.FIREBASE_CONFIG && parseFirebaseProjectId(process.env.FIREBASE_CONFIG)
  if (!projectId) throw new Error('A Firebase project ID is required via --project or environment')
  return projectId
}

function parseFirebaseProjectId(value) {
  try {
    return JSON.parse(value)?.projectId || ''
  } catch {
    return ''
  }
}

function assertProductionAuthorization(parsed, projectId) {
  const expectedConfirmation = `${DEMO_WORKSPACE_ID}:${projectId}`
  if (
    !parsed.allowProduction ||
    process.env[PRODUCTION_CONFIRMATION_ENV] !== expectedConfirmation
  ) {
    throw new Error(
      `Production execution is disabled. Pass --allow-production and set ` +
        `${PRODUCTION_CONFIRMATION_ENV}=${expectedConfirmation} to authorize this exact target.`,
    )
  }
}

function validateAndConvertFixture(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The fixture must be a JSON object')
  }
  if (value.workspaceId !== DEMO_WORKSPACE_ID) {
    throw new Error(`Fixture workspaceId must be ${DEMO_WORKSPACE_ID}`)
  }
  if (!value.documents || typeof value.documents !== 'object' || Array.isArray(value.documents)) {
    throw new Error('Fixture documents must be a document-path map')
  }

  let portfolioHistoryYearsAdded = 0
  let strategyCorrections = 0
  let timestampCorrections = 0
  const documents = Object.entries(value.documents).map(([path, documentValue]) => {
    assertReservedDocumentPath(path)
    if (!isPlainObject(documentValue)) throw new Error(`Document ${path} must contain a map`)
    const strategyDocument = canonicalizeDemoStrategy(path, documentValue, () => {
      strategyCorrections += 1
    })
    const canonicalDocument = addDemoPortfolioHistory(path, strategyDocument, (yearsAdded) => {
      portfolioHistoryYearsAdded += yearsAdded
    })
    return [
      path,
      convertTimestampMarkers(canonicalDocument, path, () => {
        timestampCorrections += 1
      }),
    ]
  })

  if (!documents.some(([path]) => path === `workspaces/${DEMO_WORKSPACE_ID}`)) {
    throw new Error('The reserved workspace document is missing')
  }
  return {
    documents,
    portfolioHistoryYearsAdded,
    strategyCorrections,
    timestampCorrections,
  }
}

// Give the demo enough immutable dividend history to exercise the historical chart. The supplied
// cache contains only 2026 payments, so enrich only that exact shape and leave future fixtures
// with their own multi-year history untouched.
function addDemoPortfolioHistory(path, value, recordCorrection) {
  const portfolioPath = `workspaces/${DEMO_WORKSPACE_ID}/modelAssets/portfolio`
  const dividends = value.detail?.portfolio?.cache?.dividends
  if (path !== portfolioPath || !Array.isArray(dividends)) return value

  const years = [...new Set(dividends.map(({ date }) => String(date || '').slice(0, 4)))]
  if (years.length !== 1 || years[0] !== '2026') return value

  const historicalDividends = [
    demoDividend('2022-12-15', 'DEMO-GLOBAL', 80),
    demoDividend('2022-12-15', 'DEMO-EU', 120),
    demoDividend('2022-12-15', 'DEMO-BOND', 50),
    demoDividend('2023-12-15', 'DEMO-GLOBAL', 105),
    demoDividend('2023-12-15', 'DEMO-EU', 155),
    demoDividend('2023-12-15', 'DEMO-BOND', 65),
    demoDividend('2024-12-15', 'DEMO-GLOBAL', 130),
    demoDividend('2024-12-15', 'DEMO-EU', 195),
    demoDividend('2024-12-15', 'DEMO-BOND', 80),
    demoDividend('2025-12-15', 'DEMO-GLOBAL', 160),
    demoDividend('2025-12-15', 'DEMO-EU', 235),
    demoDividend('2025-12-15', 'DEMO-BOND', 100),
  ]
  const allDividends = [...historicalDividends, ...dividends]
  const totalDividendsReceived = Number(
    allDividends.reduce((total, dividend) => total + Number(dividend.grossBase || 0), 0).toFixed(2),
  )

  recordCorrection(4)
  return {
    ...value,
    detail: {
      ...value.detail,
      portfolio: {
        ...value.detail.portfolio,
        summary: {
          ...value.detail.portfolio.summary,
          totalDividendsReceived,
        },
        cache: {
          ...value.detail.portfolio.cache,
          dividends: allDividends,
        },
      },
    },
  }
}

function demoDividend(date, ticker, amount) {
  return {
    date,
    ticker,
    grossLocal: amount,
    currency: 'EUR',
    fxToBase: 1,
    grossBase: amount,
  }
}

// The dashboard reserves the `default` scenario ID for its unsaved baseline. The supplied demo
// fixture persists a real configured strategy under that ID, which makes Home render the What If
// fallback instead of the strategy summary. Give only that active fixture scenario a stable demo
// ID so the existing dashboard contract can distinguish it from an untouched default.
function canonicalizeDemoStrategy(path, value, recordCorrection) {
  const strategyPath = `workspaces/${DEMO_WORKSPACE_ID}/modelConfig/whatIfStrategies`
  if (path !== strategyPath || value.activeScenarioId !== 'default') return value
  if (!Array.isArray(value.scenarios)) return value

  const activeScenario = value.scenarios.find((scenario) => scenario?.id === 'default')
  if (!activeScenario) return value
  if (value.scenarios.some((scenario) => scenario?.id === 'demo-balanced')) {
    throw new Error(`Demo strategy ID collision at ${strategyPath}`)
  }

  recordCorrection()
  return {
    ...value,
    activeScenarioId: 'demo-balanced',
    scenarios: value.scenarios.map((scenario) =>
      scenario === activeScenario ? { ...scenario, id: 'demo-balanced' } : scenario,
    ),
  }
}

function assertReservedDocumentPath(path) {
  const segments = String(path).split('/')
  if (
    segments.some((segment) => !segment) ||
    segments.length % 2 !== 0 ||
    segments[0] !== 'workspaces' ||
    segments[1] !== DEMO_WORKSPACE_ID
  ) {
    throw new Error(`Document path is outside ${DEMO_WORKSPACE_ID}: ${path}`)
  }
}

function convertTimestampMarkers(value, location, recordCorrection) {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      convertTimestampMarkers(item, `${location}[${index}]`, recordCorrection),
    )
  }
  if (!isPlainObject(value)) return value

  const keys = Object.keys(value)
  if (keys.length === 1 && keys[0] === '$timestamp') {
    const raw = value.$timestamp
    if (typeof raw !== 'string') throw new Error(`Invalid timestamp marker at ${location}`)
    const canonical = canonicalFixtureTimestamp(raw)
    if (canonical !== raw) recordCorrection()
    const date = new Date(canonical)
    if (Number.isNaN(date.getTime()) || date.toISOString() !== canonical) {
      throw new Error(`Invalid timestamp marker at ${location}: ${raw}`)
    }
    return Timestamp.fromDate(date)
  }

  if (keys.includes('$timestamp')) {
    throw new Error(`Timestamp marker at ${location} must be the only field in its map`)
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      convertTimestampMarkers(item, `${location}.${key}`, recordCorrection),
    ]),
  )
}

// The supplied fixture contains 2026 tracking dates with a one-digit day. Canonicalize only
// that unambiguous legacy shape; every other marker must already be strict UTC ISO-8601.
function canonicalFixtureTimestamp(value) {
  return value.replace(/^(\d{4}-\d{2})-(\d)T/, '$1-0$2T')
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
