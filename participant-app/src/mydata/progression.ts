import type { MySession } from './client'

export type ScoreSeries = { id: string; name: string; points: { date: string; value: number }[] }
export type InstrumentGroup = { instrument_id: string; instrument_version: string; sessions: MySession[]; series: ScoreSeries[] }

function sessionDate(s: MySession): string | null {
  return s.submitted_at ?? s.completed_at ?? s.started_at
}

/** Group a participant's sessions by questionnaire, with a chronological series per named score. */
export function groupByInstrument(sessions: MySession[]): InstrumentGroup[] {
  const byInstrument = new Map<string, MySession[]>()
  for (const s of sessions) {
    const arr = byInstrument.get(s.instrument_id) ?? []
    arr.push(s)
    byInstrument.set(s.instrument_id, arr)
  }
  const groups: InstrumentGroup[] = []
  for (const [instrument_id, list] of byInstrument) {
    const chrono = [...list].sort((a, b) => (sessionDate(a) ?? '').localeCompare(sessionDate(b) ?? ''))
    const byScore = new Map<string, ScoreSeries>()
    for (const s of chrono) {
      const date = sessionDate(s)
      if (!date || !s.score_display) continue
      for (const sc of s.score_display) {
        const ser = byScore.get(sc.id) ?? { id: sc.id, name: sc.name, points: [] }
        ser.points.push({ date, value: sc.value })
        byScore.set(sc.id, ser)
      }
    }
    groups.push({
      instrument_id,
      instrument_version: list[0].instrument_version,
      sessions: list,                       // preserve incoming order (endpoint returns newest-first) for cards
      series: [...byScore.values()],
    })
  }
  return groups
}
