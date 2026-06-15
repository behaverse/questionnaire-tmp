export type EvalValue = number | string | boolean | null | (number | string)[]
export interface Bindings { var(id: string): unknown; score(id: string): unknown }
export interface LogicEvaluator {
  condition(expr: string, bindings: Bindings): boolean
  reversedValue(value: number, min: number, max: number): number
  compareSolution(cmp: 'equals' | 'set_equals' | 'matches_regex', response: unknown, expected: unknown): boolean
  check(expr: string): string | null // null = valid; message = parse error
}
export interface ScoreResolver { score(id: string): EvalValue }
