// Authoring-time only (NOT part of the app build). Freezes the BIS/BAS resolution
// bundle into a static, self-contained {questionnaire, entities} sample so the editor
// can load it offline. Re-run if BIS/BAS is republished at a new version.
//   node scripts/build-sample.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.env.VITE_LIBRARY_BASE_URL ?? 'https://questionnaire-library.vercel.app'
const ID = 'qst_x_bisbas'
const VERSION = 'v26.0606'
const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../src/samples/bisbas.bundle.json')

const res = await fetch(`${BASE}/v1/questionnaires/${ID}/versions/${VERSION}/resolution-bundle`)
if (!res.ok) throw new Error(`resolution-bundle fetch failed: ${res.status}`)
const { definition, entities } = await res.json()
if (!definition?.metadata) throw new Error('no questionnaire definition in resolution-bundle')
if (!entities || typeof entities !== 'object') throw new Error('no entities in resolution-bundle')
const bundle = { questionnaire: definition, entities }
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(bundle, null, 2) + '\n')
console.log(`wrote ${out}: ${Object.keys(entities).length} entities, title="${definition.metadata.title}"`)
