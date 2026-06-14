import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import questionnaireSchema from '../../../schemas/questionnaire/schema.json'
import instrumentSchema from '../../../schemas/instrument/schema.json'

export interface ValidationError { path: string; message: string }

const ajv = new Ajv2020({ strict: false, allErrors: true })
addFormats(ajv)
ajv.addSchema(instrumentSchema as object) // registered by its own $id
const validateFn = ajv.compile(questionnaireSchema as object)

export function validateQuestionnaire(obj: unknown): { valid: boolean; errors: ValidationError[] } {
  const valid = validateFn(obj) as boolean
  const errors: ValidationError[] = (validateFn.errors ?? []).map((e) => ({
    path: e.instancePath || '/',
    message: `${e.instancePath || '(root)'} ${e.message ?? 'is invalid'}`.trim(),
  }))
  return { valid, errors }
}
