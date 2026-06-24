const KEY = 'behaverse.participant.refresh'

export function loadRefreshToken(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveRefreshToken(t: string): void {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* private mode: session works, just won't persist */
  }
}

export function clearRefreshToken(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
