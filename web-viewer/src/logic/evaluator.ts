import type { Bindings, LogicEvaluator } from './types'

type FakeResult = boolean | ((b: Bindings) => boolean)
export function makeFakeEvaluator(table: Record<string, FakeResult> = {}): LogicEvaluator {
  return {
    condition(expr, bindings) {
      const r = table[expr]
      if (typeof r === 'function') return r(bindings)
      return r ?? false
    },
    reversedValue: (v, min, max) => max + min - v,
    compareSolution(cmp, response, expected) {
      if (cmp === 'set_equals') {
        const a = Array.isArray(response) ? response : []
        const b = Array.isArray(expected) ? expected : []
        return a.length === b.length && a.every((x) => b.includes(x)) && b.every((y) => a.includes(y))
      }
      if (cmp === 'matches_regex') {
        try { return typeof response === 'string' && typeof expected === 'string' && new RegExp(expected).test(response) }
        catch { return false }
      }
      return JSON.stringify(response) === JSON.stringify(expected)
    },
    check: () => null,
  }
}

/** The shape of the wasm-pack `--target web` exports we use. */
export interface WasmExports {
  evaluate_condition(expr: string, bindings: Bindings): boolean
  reversed(value: number, min: number, max: number): number
  compare(cmp: string, response: unknown, expected: unknown): boolean
  check_expression(expr: string): string | undefined
}
export function wasmAdapter(exports: WasmExports): LogicEvaluator {
  return {
    condition: (expr, bindings) => {
      try { return exports.evaluate_condition(expr, bindings) } catch { return false }
    },
    reversedValue: (v, min, max) => exports.reversed(v, min, max),
    compareSolution: (cmp, response, expected) => exports.compare(cmp, response, expected),
    check: (expr) => exports.check_expression(expr) ?? null,
  }
}

/** Production: lazy-load the real WASM (built `--target web` into ./wasm). Browser only.
 *  Static-string dynamic import so Vite analyses it, code-splits the module, and emits the
 *  `.wasm` asset (a variable path with @vite-ignore would NOT bundle → 404 in prod). The
 *  module is absent during typecheck/tests (built only at `npm run build`); the ambient
 *  declaration in wasm-ambient.d.ts satisfies tsc, and tests mock loadEvaluator so vitest
 *  never resolves it. */
export async function loadEvaluator(): Promise<LogicEvaluator> {
  const mod = await import('./wasm/questionnaire_expr_web.js')
  await mod.default()
  return wasmAdapter(mod as unknown as WasmExports)
}
