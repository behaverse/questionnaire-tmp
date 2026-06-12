import type { AnswerValue } from '../renderer/types'

export type ResumeRecord = {
  deploymentId: string
  sessionId: string
  token: string
  lastActiveLocale: string
  answers: Record<string, AnswerValue>
  stepIndex: number
  visited: number[]
  updatedAt: string
  agentId?: string
  sessionIndex?: number
}
export interface ResumeStore {
  get(deploymentId: string): Promise<ResumeRecord | null>
  put(record: ResumeRecord): Promise<void>
  clear(deploymentId: string): Promise<void>
}
