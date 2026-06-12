import type { ResumeRecord, ResumeStore } from './types'

const DB_NAME = 'behaverse-web-viewer'
const STORE = 'resume'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'deploymentId' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
      }),
  )
}

export function indexedDbStore(): ResumeStore {
  return {
    async get(deploymentId) {
      const r = await tx<ResumeRecord | undefined>('readonly', (s) => s.get(deploymentId) as IDBRequest<ResumeRecord | undefined>)
      return r ?? null
    },
    async put(record) { await tx('readwrite', (s) => s.put(record) as IDBRequest<IDBValidKey>) },
    async clear(deploymentId) { await tx('readwrite', (s) => s.delete(deploymentId) as unknown as IDBRequest<undefined>) },
  }
}

export function makeFakeStore(seed: ResumeRecord[] = []): ResumeStore {
  const map = new Map<string, ResumeRecord>(seed.map((r) => [r.deploymentId, r]))
  return {
    get: async (id) => map.get(id) ?? null,
    put: async (r) => { map.set(r.deploymentId, structuredClone(r)) },
    clear: async (id) => { map.delete(id) },
  }
}

let singleton: ResumeStore | null = null
/** Production accessor (browser IndexedDB). App tests vi.mock this module to inject a fake. */
export function getResumeStore(): ResumeStore {
  if (!singleton) singleton = indexedDbStore()
  return singleton
}
