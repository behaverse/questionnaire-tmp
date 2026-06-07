import { useNavigate } from 'react-router-dom'
import type { DefMetadata, VersionInfo } from '../api/types'
import { Badge } from '../components/Badge'
import { licenseLabel, languageLabel } from '../lib/labels'

export interface MetadataHeaderProps {
  meta: DefMetadata
  version: string
  allVersions: VersionInfo[]
  lang: string
  onLang: (l: string) => void
  onDownload: () => void
}

export function MetadataHeader({ meta, version, allVersions, lang, onLang, onDownload }: MetadataHeaderProps) {
  const navigate = useNavigate()
  const langs = meta.available_languages ?? (meta.language ? [meta.language] : [])
  return (
    <header className="border-b border-slate-200 pb-6">
      <h1 className="text-2xl font-semibold text-slate-900">{meta.title}</h1>
      {meta.short_title && meta.short_title !== meta.title && (
        <p className="mt-0.5 text-slate-500">{meta.short_title}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {meta.license && <Badge>{licenseLabel(meta.license)}</Badge>}
        {meta.publication?.doi && (
          <a className="text-sm text-accent hover:underline" href={`https://doi.org/${meta.publication.doi}`} target="_blank" rel="noreferrer">
            doi:{meta.publication.doi}
          </a>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {allVersions.length > 0 && (
          <label className="text-sm text-slate-600">
            Version{' '}
            <select
              aria-label="Version"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={version}
              onChange={(e) => { if (e.target.value !== version) navigate(`/q/${meta.id}/${e.target.value}`) }}
            >
              {allVersions.map((v) => <option key={v.version} value={v.version}>{v.version}{v.status !== 'published' ? ` (${v.status})` : ''}</option>)}
            </select>
          </label>
        )}
        {langs.length > 1 && (
          <label className="text-sm text-slate-600">
            Language{' '}
            <select
              aria-label="Language"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
              value={lang}
              onChange={(e) => onLang(e.target.value)}
            >
              {langs.map((l) => <option key={l} value={l}>{languageLabel(l)}</option>)}
            </select>
          </label>
        )}
        <button className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90" onClick={onDownload}>
          Download JSON
        </button>
      </div>
    </header>
  )
}
