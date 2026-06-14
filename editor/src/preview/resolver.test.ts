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
