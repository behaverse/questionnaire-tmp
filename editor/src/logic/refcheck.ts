import type { IdCatalogue } from './ids'

const RESERVED = new Set([
  'true', 'false', 'null', 'in',
  'length', 'count', 'contains', 'is_empty', 'not_empty', 'score',
])

/** Identifiers referenced by `expr` that are not in the catalogue (and not reserved).
 *  Lexer-lite: strips single-quoted string literals first (with \' escapes), then matches
 *  lowercase-leading identifiers per the grammar. Warning-grade — ids may precede their node. */
export function unknownRefs(expr: string, cat: IdCatalogue): string[] {
  const known = new Set([...cat.questionIds, ...cat.scoreIds])
  const noStrings = expr.replace(/'(?:\\.|[^'\\])*'/g, ' ')
  const ids = noStrings.match(/[a-z][a-z0-9_]*/g) ?? []
  const out: string[] = []
  const seen = new Set<string>()
  for (const id of ids) {
    if (RESERVED.has(id) || known.has(id) || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}
