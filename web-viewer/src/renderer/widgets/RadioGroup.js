import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function RadioGroup({ name, label, choices, value, onChange, keyHints = false }) {
    useEffect(() => {
        if (!keyHints)
            return;
        function onKey(e) {
            if (e.metaKey || e.ctrlKey || e.altKey)
                return;
            const target = e.target;
            if (target instanceof HTMLInputElement && ['text', 'number', 'email'].includes(target.type))
                return;
            if (target instanceof HTMLTextAreaElement)
                return;
            const i = e.key.length === 1 ? LETTERS.indexOf(e.key.toUpperCase()) : -1;
            if (i >= 0 && i < choices.length)
                onChange(choices[i].value);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [keyHints, choices, onChange]);
    return (_jsx("div", { role: "radiogroup", "aria-label": label, className: "flex flex-col gap-2.5", children: choices.map((c, i) => {
            const selected = value === c.value;
            return (_jsxs("label", { className: `flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-lg transition-colors ${selected ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-slate-300'}`, children: [_jsx("input", { type: "radio", name: name, checked: selected, onChange: () => onChange(c.value), className: "sr-only" }), keyHints && (_jsx("span", { "aria-hidden": true, className: `grid h-6 w-6 shrink-0 place-items-center rounded border text-xs font-semibold ${selected ? 'border-primary' : 'border-slate-300 text-slate-500'}`, children: LETTERS[i] })), _jsx("span", { children: c.text })] }, c.index));
        }) }));
}
