/// <reference types="vite/client" />

/** Portal launch/config params. The portal needs the service URLs (for the catalogue + my-data
 *  fetches and the Identity session) and the player base URL (where to launch questionnaires).
 *  Query overrides win over Vite env, which falls back to localhost dev ports. */
export type Params = {
  vsBaseUrl: string
  identityBaseUrl: string
  playerBaseUrl: string
}

export function parseParams(search: string): Params {
  const q = new URLSearchParams(search)
  return {
    vsBaseUrl: q.get('viewer_url') ?? import.meta.env.VITE_VS_BASE_URL ?? 'http://localhost:8001',
    identityBaseUrl: q.get('identity_url') ?? import.meta.env.VITE_IDENTITY_BASE_URL ?? 'http://localhost:8100',
    playerBaseUrl: q.get('player_url') ?? import.meta.env.VITE_PLAYER_BASE_URL ?? 'http://localhost:5173',
  }
}
