import { mergeOptions } from '../merge'
import { isItem } from '../guards'
import { elementKey, sectionChildFallback } from '../keys'
import type { AnswerValue, SectionElement } from '../types'
import { UnsupportedElement } from './UnsupportedElement'

type Props = {
  sectionKey: string
  section: SectionElement
  locale: string
  answers: Record<string, AnswerValue>
  onAnswer: (key: string, value: AnswerValue) => void
  requiredErrors: string[]
  requiredText: string
  unsupportedNotice: string
}

export function MatrixGroup({ sectionKey, section, locale, answers, onAnswer, requiredErrors, requiredText, unsupportedNotice }: Props) {
  let choices
  try {
    choices = mergeOptions(section.shared_option!, locale)
  } catch (err) {
    return <UnsupportedElement id={sectionKey} reason={(err as Error).message} notice={unsupportedNotice} />
  }
  const rows = section.elements.map((el, j) => ({ key: elementKey(el, sectionChildFallback(sectionKey, j)), el }))
  const failing = rows.some((r) => requiredErrors.includes(r.key))
  return (
    <div className="space-y-3">
      {section.title && <h2 tabIndex={-1} className="qv-prompt">{section.title}</h2>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-separate border-spacing-y-1">
          <thead>
            <tr>
              <td className="min-w-48"></td>
              {choices.map((c) => (
                <th key={c.index} scope="col" className="px-3 pb-2 text-center text-sm font-medium text-slate-500">{c.text}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, el }) => {
              if (!isItem(el)) return null
              const prompt = el.question.prompt?.content?.[locale]?.text ?? ''
              const rowFails = requiredErrors.includes(key)
              return (
                <tr key={key} className={rowFails ? 'bg-error/5' : undefined}>
                  <th scope="row" className="py-2 pr-4 text-left text-base font-normal">{prompt}</th>
                  {choices.map((c) => (
                    <td key={c.index} className="px-3 text-center">
                      <input
                        type="radio"
                        name={key}
                        aria-label={`${prompt}: ${c.text}`}
                        checked={answers[key] === c.value}
                        onChange={() => onAnswer(key, c.value)}
                        className="h-5 w-5 accent-[var(--qv-primary)]"
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {failing && <p role="alert" className="font-medium text-error">{requiredText}</p>}
    </div>
  )
}
