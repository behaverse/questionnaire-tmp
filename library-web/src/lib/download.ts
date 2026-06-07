export const definitionFilename = (id: string, version: string): string => `${id}@${version}.json`

/**
 * Trigger a browser download of a same-origin, `blob:`, or `data:` URL under a chosen filename.
 * NOTE: the HTML `download` attribute is IGNORED by browsers for cross-origin URLs — for those,
 * use `downloadJson` (which fetches into a same-origin blob first).
 */
export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Fetch a (possibly cross-origin, CORS-enabled) URL and trigger a named download via a same-origin
 * blob URL — so the chosen filename is always honored and the download reliably fires.
 */
export async function downloadJson(url: string, filename: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    downloadUrl(objectUrl, filename)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
