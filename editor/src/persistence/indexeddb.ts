import type { Questionnaire, EntityBody } from '../model/types'
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

export async function saveDraft(model: Questionnaire, source: Source, pool: Record<string, EntityBody> = {}): Promise<void> {
  const draft: Draft = { model, source, savedAt: Date.now(), entities: pool }
  await tx('readwrite', (s) => s.put(draft, KEY))
}

export async function loadDraft(): Promise<Draft | null> {
  const res = await tx<Draft | undefined>('readonly', (s) => s.get(KEY))
  return res ? { ...res, entities: res.entities ?? {} } : null
}

export async function clearDraft(): Promise<void> {
  await tx('readwrite', (s) => s.delete(KEY))
}

// ── Translation Workbench session (DB-wide "Translate Library entities") ──────────────
// Persisted separately from the questionnaire draft so in-progress translations + completion
// status survive a reload. Stored in the same object store under a distinct key (no schema bump).
const WB_KEY = 'workbench'
export interface WorkbenchSession {
  kind: string
  source: string
  target: string
  items: { id: string; version: string; kind: string; body: Record<string, unknown> }[]
  bodies: Record<string, Record<string, unknown>>
  savedAt: number
}
export async function saveWorkbench(session: WorkbenchSession): Promise<void> {
  await tx('readwrite', (s) => s.put(session, WB_KEY))
}
export async function loadWorkbench(): Promise<WorkbenchSession | null> {
  const res = await tx<WorkbenchSession | undefined>('readonly', (s) => s.get(WB_KEY))
  return res ?? null
}
export async function clearWorkbench(): Promise<void> {
  await tx('readwrite', (s) => s.delete(WB_KEY))
}

// ── Library Entity Browser session (ED-K2) — separate key from the draft + workbench slots ──
const LIB_KEY = 'library-session'
export interface LibrarySession { bodies: Record<string, Record<string, unknown>>; savedAt: number }
export async function saveLibrarySession(s: LibrarySession): Promise<void> {
  await tx('readwrite', (st) => st.put(s, LIB_KEY))
}
export async function loadLibrarySession(): Promise<LibrarySession | null> {
  const res = await tx<LibrarySession | undefined>('readonly', (st) => st.get(LIB_KEY))
  return res ?? null
}
export async function clearLibrarySession(): Promise<void> {
  await tx('readwrite', (st) => st.delete(LIB_KEY))
}
