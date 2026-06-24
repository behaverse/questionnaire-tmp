/* tslint:disable */
/* eslint-disable */

/**
 * Validate an expression at authoring time (Editor). Returns null on success, message on failure.
 */
export function check_expression(expr: string): string | undefined;

export function compare(cmp: string, response: any, expected: any): boolean;

/**
 * Compile + evaluate a condition. Throws on parse error; non-Bool result → false (sentinel).
 */
export function evaluate_condition(expr: string, bindings: any): boolean;

export function reversed(value: number, min: number, max: number): number;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly check_expression: (a: number, b: number) => [number, number];
    readonly compare: (a: number, b: number, c: any, d: any) => [number, number, number];
    readonly evaluate_condition: (a: number, b: number, c: any) => [number, number, number];
    readonly reversed: (a: number, b: number, c: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
