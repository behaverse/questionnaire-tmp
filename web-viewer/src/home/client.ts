export type CatalogueItem = {
  deployment_id: string
  title: string
  description: string | null
  questionnaire_ref: string
  auth: string | null
}
export type CatalogueResult = { ok: true; items: CatalogueItem[] } | { ok: false; error: 'network' }

export async function fetchCatalogue(vsBaseUrl: string): Promise<CatalogueResult> {
  let resp: Response
  try {
    resp = await fetch(`${vsBaseUrl}/v1/catalogue`)
  } catch {
    return { ok: false, error: 'network' }
  }
  if (resp.ok) return { ok: true, items: (await resp.json()).items ?? [] }
  return { ok: false, error: 'network' }
}
