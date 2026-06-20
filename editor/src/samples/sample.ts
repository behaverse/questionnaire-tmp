import type { Questionnaire, EntityBody } from '../model/types'
import bundle from './bisbas.bundle.json'
import phq9bundle from './phq9.bundle.json'

export const bisbasSample = bundle as unknown as {
  questionnaire: Questionnaire
  entities: Record<string, EntityBody>
}

export const phq9Sample = phq9bundle as unknown as {
  questionnaire: Questionnaire
  entities: Record<string, EntityBody>
}
