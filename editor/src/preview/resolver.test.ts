import { resolveEntities, type FetchEntity } from './resolver'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_t' },
  pages: [{ id: 'p1', elements: [{ question: { prompt: { ref: 'pr_a@v1' } }, option: { ref: 'opt_a@v1' } }] }],
} as unknown as Questionnaire

test('resolves all refs transitively and caches (no refetch)', async () => {
  const bodies: Record<string, Record<string, unknown>> = {
    'pr_a@v1': { id: 'pr_a', content: {} },
    'opt_a@v1': { id: 'opt_a', placeholder: { ref: 'ph_a@v1' } },
    'ph_a@v1': { id: 'ph_a', content: {} },
  }
  const calls: string[] = []
  const fetchEntity: FetchEntity = async (ref) => { calls.push(ref); return bodies[ref] ?? null }
  const map = await resolveEntities(model, fetchEntity)
  expect(map.get('pr_a@v1')).toEqual({ id: 'pr_a', content: {} })
  expect(map.get('ph_a@v1')).toEqual({ id: 'ph_a', content: {} })
  const before = calls.length
  await resolveEntities(model, fetchEntity, map)
  expect(calls.length).toBe(before)
})

test('records null for an unresolvable ref without throwing', async () => {
  const fetchEntity: FetchEntity = async () => null
  const map = await resolveEntities(model, fetchEntity)
  expect(map.get('pr_a@v1')).toBeNull()
})

test('a throwing fetchEntity is treated as unresolvable (never rejects)', async () => {
  const throwing: FetchEntity = async () => { throw new Error('boom') }
  const map = await resolveEntities(model, throwing)
  expect(map.get('pr_a@v1')).toBeNull()
})

import { describe, it, expect } from 'vitest'

describe('resolveEntities concurrency', () => {
  it('never runs more than 5 fetches at once', async () => {
    const model2 = {
      metadata: { id: 'qst_t', title: 'T', language: 'en' },
      pages: [{ id: 'p1', elements: Array.from({ length: 20 }, (_, i) => ({
        id: `it_${i}`, question: { prompt: { ref: `pr_${i}@v1` } },
        option: { ref: `opt_${i}@v1` },
      })) }],
    } as unknown as Questionnaire
    let active = 0, peak = 0
    const fetchEntity = async () => {
      active++; peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 3))
      active--; return null
    }
    await resolveEntities(model2, fetchEntity)
    expect(peak).toBeLessThanOrEqual(5)
  })
})
