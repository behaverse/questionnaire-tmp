import type { ContentEntity } from '../types'

export function MessageBlock({ element, locale }: { element: ContentEntity; locale: string }) {
  const text = element.content?.[locale]?.text ?? ''
  return <div className="whitespace-pre-line text-xl leading-relaxed" style={{ color: 'var(--qv-prompt-color)' }}>{text}</div>
}
