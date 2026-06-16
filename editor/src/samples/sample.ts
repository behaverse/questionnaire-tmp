import type { Questionnaire, EntityBody } from '../model/types'
import bundle from './bisbas.bundle.json'

export const bisbasSample = bundle as unknown as {
  questionnaire: Questionnaire
  entities: Record<string, EntityBody>
}
