import { useNavigate } from 'react-router-dom'
import type { DefMetadata, VersionInfo } from '../api/types'
import { licenseLabel, languageLabel } from '../lib/labels'

export interface MetadataHeaderProps {
  meta: DefMetadata
  version: string
  allVersions: VersionInfo[]
  lang: string
  onLang: (l: string) => void
  onDownload: () => void
  previewHref: string
}

const selectCls =
  'cursor-pointer rounded-md border border-rule bg-paper-raised px-2.5 py-1 text-sm text-ink shadow-card transition-colors hover:border-ink-faint/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20'

export function MetadataHeader({ meta, version, allVersions, lang, onLang, onDownload, previewHref }: MetadataHeaderProps) {
  const navigate = useNavigate()
  const langs = meta.available_languages ?? (meta.language ? [meta.language] : [])
  return (
    <header className="border-b border-rule pb-7">
      {meta.id && (
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">{meta.id}</p>
      )}
      <h1 className="font-serif text-[32px] font-semibold leading-[1.12] tracking-tightish text-ink sm:text-[38px]">
        {meta.title}
      </h1>
      {meta.short_title && meta.short_title !== meta.title && (
        <p className="mt-1.5 font-serif text-lg text-ink-faint">{meta.short_title}</p>
      )}
      {meta.variant && meta.variant !== 'base' && (
        <p className="mt-2">
          <span className="inline-block rounded bg-paper-sunken px-2 py-0.5 font-sans text-sm font-medium text-ink-soft">
            {meta.variant}
          </span>
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        {meta.license && (
          <span className="text-sm text-ink-soft">
            <span className="text-ink-faint">License:</span> {licenseLabel(meta.license)}
          </span>
        )}
        {meta.publication?.doi && (
          <a
            className="inline-flex items-center gap-1 font-mono text-[13px] text-accent underline-offset-2 transition-opacity hover:underline"
            href={`https://doi.org/${meta.publication.doi}`}
            target="_blank"
            rel="noreferrer"
          >
            doi:{meta.publication.doi}
          </a>
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {allVersions.length > 0 && (
          <label className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">Version</span>
            <select
              aria-label="Version"
              className={selectCls}
              value={version}
              onChange={(e) => { if (e.target.value !== version) navigate(`/q/${meta.id}/${e.target.value}`) }}
            >
              {allVersions.map((v) => <option key={v.version} value={v.version}>{v.version}{v.status !== 'published' ? ` (${v.status})` : ''}</option>)}
            </select>
          </label>
        )}
        {langs.length > 1 && (
          <label className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-faint">Language</span>
            <select
              aria-label="Language"
              className={selectCls}
              value={lang}
              onChange={(e) => onLang(e.target.value)}
            >
              {langs.map((l) => <option key={l} value={l}>{languageLabel(l)}</option>)}
            </select>
          </label>
        )}
        <a
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-paper-raised px-3.5 py-2 text-sm font-medium text-ink shadow-card transition-colors hover:border-accent hover:text-accent"
          href={previewHref}
        >
          <svg aria-hidden viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
            <path d="M5 3.5v9l7-4.5-7-4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          Try it
        </a>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-paper shadow-card transition-colors hover:bg-accent"
          onClick={onDownload}
        >
          <svg aria-hidden viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
            <path d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download JSON
        </button>
      </div>
    </header>
  )
}
