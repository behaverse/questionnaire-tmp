import { buildBundle, type BundleItem } from './bundle'

export function translationsFilename(target: string): string {
  return `translations.${target}.json`
}

export function exportTranslations(target: string, items: BundleItem[], generatedAt: string): void {
  const bundle = buildBundle(target, items, generatedAt)
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = translationsFilename(target)
  a.click()
  URL.revokeObjectURL(url)
}
