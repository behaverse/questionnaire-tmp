import type { Questionnaire } from '../model/types'
import type { Source } from '../state/store'

const DB_NAME = 'behaverse-editor'
const STORE = 'drafts'
const KEY = 'current'

export interface Draft { model: Questionnaire; source: Source; savedAt: number }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

export async function saveDraft(model: Questionnaire, source: Source): Promise<void> {
  const draft: Draft = { model, source, savedAt: Date.now() }
  await tx('readwrite', (s) => s.put(draft, KEY))
}

export async function loadDraft(): Promise<Draft | null> {
  const res = await tx<Draft | undefined>('readonly', (s) => s.get(KEY))
  return res ?? null
}

export async function clearDraft(): Promise<void> {
  await tx('readwrite', (s) => s.delete(KEY))
}
