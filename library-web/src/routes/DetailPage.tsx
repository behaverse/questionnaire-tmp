import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useResolvedDefinition, useVersions } from '../api/queries'
import { ApiError, rawDefinitionUrl } from '../api/client'
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
  { id: 'items', label: 'Items' },
  { id: 'scores', label: 'Scores' },
  { id: 'versions', label: 'Versions' },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-slate-200 pt-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  )
}

export function DetailPage() {
  const { id = '', version } = useParams()
  const versionsQ = useVersions(id)
  const latest = version ?? versionsQ.data?.find((v) => v.status === 'published')?.version
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

  if (defQ.error instanceof ApiError && defQ.error.status === 404) return <NotFoundPage />
  if (defQ.error instanceof ApiError && defQ.error.status === 410) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Withdrawn</h1>
        <p className="mt-2 text-slate-600">This questionnaire version has been removed from the library; its definition is no longer available.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {(versionsQ.isLoading || defQ.isLoading) && (
        <div className="space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40 w-full" /></div>
      )}
      {defQ.isError && !(defQ.error instanceof ApiError) && (
        <ErrorState message="Could not load this questionnaire." onRetry={() => defQ.refetch()} />
      )}
      {defQ.isSuccess && meta && model && latest && (
        <div className="flex gap-10">
          <div className="min-w-0 flex-1 space-y-8">
            <MetadataHeader
              meta={meta}
              version={latest}
              allVersions={versionsQ.data ?? []}
              lang={effectiveLang}
              onLang={setLang}
              onDownload={() => { void downloadJson(rawDefinitionUrl(id, latest), definitionFilename(id, latest)).catch((e) => console.error(e)) }}
            />
            {present.description && <Section id="description" title="Description"><p className="text-slate-700">{meta.description}</p></Section>}
            {present.classification && <Section id="classification" title="Classification"><ClassificationBlock meta={meta} /></Section>}
            {present.psychometrics && <Section id="psychometrics" title="Psychometrics"><PsychometricsBlock meta={meta} /></Section>}
            {present.citation && <Section id="citation" title="Authors & citation"><CitationBlock meta={meta} /></Section>}
            <Section id="items" title="Items"><ItemsBlock model={model} /></Section>
            {present.scores && <Section id="scores" title="Scores"><ScoresBlock scores={defQ.data.scores} /></Section>}
            {present.versions && <Section id="versions" title="Versions"><VersionList id={id} versions={versionsQ.data ?? []} current={latest} /></Section>}
          </div>
          <SectionNav items={navItems} />
        </div>
      )}
    </main>
  )
}
