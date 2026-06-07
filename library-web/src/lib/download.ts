export const definitionFilename = (id: string, version: string): string => `${id}@${version}.json`

/** Trigger a browser download of a URL under a chosen filename. */
export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
