/// <reference types="vite/client" />

/** Build the URL that launches the web-viewer **player** to *try* (render-only, no data captured)
 *  a Library questionnaire. The player fetches the runtime from the VS preview endpoint; `return_url`
 *  brings the visitor back to this Library page when they click Done. Locale is the questionnaire's
 *  own default (passed in) so the VS preview never hits an unsupported-locale error. */
export function previewPlayerUrl(ref: string, lang: string): string {
  const player = (import.meta.env.VITE_PLAYER_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:5173'
  const vs = (import.meta.env.VITE_VS_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8001'
  const q = new URLSearchParams({ preview: ref, locale: lang, viewer_url: vs, return_url: window.location.href })
  return `${player}/?${q.toString()}`
}
