import { describe, it, expect } from 'vitest'
import { bisbasSample } from './sample'
import { validateQuestionnaire } from '../model/validation'

describe('bisbasSample', () => {
  it('is a self-contained, Schema-2-valid bundle', () => {
    expect(bisbasSample.questionnaire.metadata.id).toBe('qst_x_bisbas')
    expect(Object.keys(bisbasSample.entities).length).toBeGreaterThan(0)
    const { valid, errors } = validateQuestionnaire(bisbasSample.questionnaire)
    expect(valid, JSON.stringify(errors)).toBe(true)
  })
})
