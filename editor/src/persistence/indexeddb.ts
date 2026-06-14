import type { Questionnaire } from '../model/types'
import type { Source, Draft } from '../state/types'

const DB_NAME = 'behaverse-editor'
const STORE = 'drafts'
const KEY = 'current'

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
    const transaction = db.transaction(STORE, mode)
    const store = transaction.objectStore(STORE)
    const req = fn(store)
    let result: T
    req.onsuccess = () => { result = req.result as T }
    req.onerror = () => reject(req.error)
    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
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
