// Shared participant auth/session package — consumed by participant-app (portal) and web-viewer (player)
// via a source path alias (@behaverse/participant-session). Single source of truth for the Identity
// client + the SessionProvider (persistent login, silent refresh, logout).
export * from './SessionProvider'
export * from './client'
export * from './authFetch'
export * from './storage'
