import 'fake-indexeddb/auto'
import { indexedDbStore, makeFakeStore } from './store'
import type { ResumeRecord } from './types'

const rec = (deploymentId: string): ResumeRecord => ({
  deploymentId, sessionId: 's1', token: 't1', lastActiveLocale: 'en',
  answers: { it_1: 0 }, stepIndex: 2, visited: [0, 1], updatedAt: '2026-06-12T00:00:00Z',
})

describe.each([
  ['indexedDbStore', () => indexedDbStore()],
  ['makeFakeStore', () => makeFakeStore()],
])('%s round-trips', (_name, make) => {
  test('put → get → clear', async () => {
    const s = make()
    expect(await s.get('dpl_1')).toBeNull()
    await s.put(rec('dpl_1'))
    expect(await s.get('dpl_1')).toEqual(rec('dpl_1'))
    await s.put({ ...rec('dpl_2'), sessionId: 's2' })
    expect((await s.get('dpl_2'))?.sessionId).toBe('s2')
    expect((await s.get('dpl_1'))?.sessionId).toBe('s1')
    await s.clear('dpl_1')
    expect(await s.get('dpl_1')).toBeNull()
    expect(await s.get('dpl_2')).not.toBeNull()
  })
})
