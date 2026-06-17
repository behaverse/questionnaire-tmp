import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-ed-accent text-white border border-transparent hover:brightness-110',
  secondary: 'bg-ed-panel text-ed-text border border-ed-border-strong hover:bg-ed-subtle',
  ghost: 'bg-transparent text-ed-text border border-transparent hover:bg-ed-subtle',
  danger: 'bg-ed-panel text-ed-danger border border-ed-border-strong hover:bg-red-50',
}
const BASE = 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ' +
  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent disabled:opacity-40'

export function Button(
  { variant = 'secondary', icon: Icon, children, className = '', ...rest }:
  { variant?: Variant; icon?: LucideIcon; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button className={`${BASE} ${VARIANT[variant]} ${className}`} {...rest}>
      {Icon && <Icon size={15} aria-hidden="true" />}
      {children}
    </button>
  )
}

export function IconButton(
  { icon: Icon, label, className = '', ...rest }:
  { icon: LucideIcon; label: string } & ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button aria-label={label} title={label}
      className={`inline-flex items-center justify-center rounded-md p-1.5 text-ed-muted transition-colors hover:bg-ed-subtle hover:text-ed-text focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${className}`}
      {...rest}>
      <Icon size={16} aria-hidden="true" />
    </button>
  )
}
