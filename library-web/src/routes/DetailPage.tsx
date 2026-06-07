import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useResolvedDefinition, useVersions } from '../api/queries'
import { ApiError, resolvedDefinitionUrl } from '../api/client'
import { buildRenderModel } from '../definition/renderModel'
import { MetadataHeader } from '../detail/MetadataHeader'
import { ItemsBlock } from '../detail/ItemsBlock'
import { VersionList } from '../detail/VersionList'
import { SectionNav } from '../detail/SectionNav'
import { ClassificationBlock, PsychometricsBlock, CitationBlock, ScoresBlock } from '../detail/MetaBlocks'
import { Skeleton } from '../components/Skeleton'
import { ErrorState } from '../components/ErrorState'
import { NotFoundPage } from './NotFoundPage'
import { definitionFilename, downloadJson } from '../lib/download'

const SECTIONS = [
  { id: 'description', label: 'Description' },
  { id: 'classification', label: 'Classification' },
  { id: 'psychometrics', label: 'Psychometrics' },
  { id: 'citation', label: 'Authors & citation' },
  { id: 'items', label: 'Content' },
  { id: 'scores', label: 'Scores' },
  { id: 'versions', label: 'Versions' },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-rule pt-7">
      <h2 className="mb-4 flex items-center gap-2.5 font-sans text-[13px] font-semibold uppercase tracking-[0.13em] text-ink-faint">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent/70" />
        {title}
      </h2>
      {children}
    </section>
  )
}

export function DetailPage() {
  const { id = '', version } = useParams()
  const versionsQ = useVersions(id)
  const latest = version ?? versionsQ.data?.find((v) => v.status === 'published')?.version ?? versionsQ.data?.[0]?.version
  const defQ = useResolvedDefinition(id, latest, true)
  const [lang, setLang] = useState<string | null>(null)

  useEffect(() => { setLang(null) }, [id])

  const meta = defQ.data?.metadata
  const effectiveLang = lang ?? meta?.language ?? 'en'
  const model = useMemo(
    () => (defQ.data ? buildRenderModel(defQ.data, effectiveLang) : null),
    [defQ.data, effectiveLang],
  )

  const scores = defQ.data?.scores
  const present = {
    description: !!meta?.description,
    classification: !!meta?.classification,
    psychometrics: !!meta?.psychometrics,
    citation: !!(meta?.authors || meta?.publication),
    items: true,
    scores: !!(scores && scores.length),
    versions: (versionsQ.data ?? []).length > 0,
  }
  const navItems = SECTIONS.filter((s) => present[s.id as keyof typeof present])

  const notFound = (e: unknown): e is ApiError => e instanceof ApiError && e.status === 404
  if (notFound(versionsQ.error) || notFound(defQ.error)) return <NotFoundPage />
  if (defQ.error instanceof ApiError && defQ.error.status === 410) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <span aria-hidden className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-amber-800 ring-1 ring-inset ring-amber-200">
          Removed entry
        </span>
        <h1 className="mt-5 font-serif text-3xl font-semibold text-ink">Withdrawn</h1>
        <p className="mt-3 leading-relaxed text-ink-soft">This questionnaire version has been removed from the library; its definition is no longer available.</p>
      </main>
    )
  }
  const networkError =
    (versionsQ.isError && !(versionsQ.error instanceof ApiError)) ||
    (defQ.isError && !(defQ.error instanceof ApiError))

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {(versionsQ.isLoading || defQ.isLoading) && (
        <div className="space-y-4"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-44 w-full" /></div>
      )}
      {networkError && (
        <ErrorState message="Could not load this questionnaire." onRetry={() => { void versionsQ.refetch(); void defQ.refetch() }} />
      )}
      {defQ.isSuccess && meta && model && latest && (
        <div className="flex gap-12">
          <div className="min-w-0 flex-1 space-y-9">
            <MetadataHeader
              meta={meta}
              version={latest}
              allVersions={versionsQ.data ?? []}
              lang={effectiveLang}
              onLang={setLang}
              onDownload={() => { void downloadJson(resolvedDefinitionUrl(id, latest), definitionFilename(id, latest)).catch((e) => console.error(e)) }}
            />
            {present.description && <Section id="description" title="Description"><p className="max-w-2xl text-[15px] leading-7 text-ink-soft">{meta.description}</p></Section>}
            {present.classification && <Section id="classification" title="Classification"><ClassificationBlock meta={meta} /></Section>}
            {present.psychometrics && <Section id="psychometrics" title="Psychometrics"><PsychometricsBlock meta={meta} /></Section>}
            {present.citation && <Section id="citation" title="Authors & citation"><CitationBlock meta={meta} /></Section>}
            <Section id="items" title="Content"><ItemsBlock model={model} /></Section>
            {present.scores && <Section id="scores" title="Scores"><ScoresBlock scores={defQ.data.scores} /></Section>}
            {present.versions && <Section id="versions" title="Versions"><VersionList id={id} versions={versionsQ.data ?? []} current={latest} /></Section>}
          </div>
          <SectionNav items={navItems} />
        </div>
      )}
    </main>
  )
}
