import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const here = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(here, '..', 'manifest.json'), 'utf8'))
const schema = JSON.parse(readFileSync(join(here, '..', '..', 'schemas', 'viewer_conformance', 'schema.json'), 'utf8'))

const ajv = new Ajv2020({ strict: false })
addFormats(ajv)
if (!ajv.validate(schema, manifest)) {
  console.error('manifest.json does NOT validate against Schema 7:')
  console.error(ajv.errors)
  process.exit(1)
}

const bootstrap = readFileSync(join(here, '..', 'src', 'app', 'bootstrap.ts'), 'utf8')
for (const [name, val] of [['VIEWER_ID', manifest.viewer_id], ['VIEWER_VERSION', manifest.viewer_version]]) {
  if (!bootstrap.includes(`'${val}'`)) {
    console.error(`bootstrap.ts does not contain ${name} value '${val}' from manifest.json`)
    process.exit(1)
  }
}
console.log('manifest.json: valid Schema 7 ✓')
