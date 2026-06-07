const LICENSE_LABELS: Record<string, string> = {
  public_domain: 'Public domain',
  cc0: 'CC0',
  cc_by: 'CC BY',
  cc_by_sa: 'CC BY-SA',
  cc_by_nc: 'CC BY-NC',
  proprietary_open_redistribution: 'Proprietary (open redistribution)',
  proprietary_restricted: 'Proprietary (restricted)',
  mixed_see_components: 'Mixed (see components)',
  unknown: 'Unknown',
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English', fr: 'French', de: 'German', lb: 'Luxembourgish',
  pt: 'Portuguese', es: 'Spanish', it: 'Italian',
}

export const licenseLabel = (tag: string | null | undefined): string =>
  tag ? (LICENSE_LABELS[tag] ?? tag) : '—'

export const languageLabel = (code: string | null | undefined): string =>
  code ? (LANGUAGE_LABELS[code] ?? code) : '—'
