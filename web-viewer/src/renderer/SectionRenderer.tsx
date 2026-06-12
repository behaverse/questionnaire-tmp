import { ItemRenderer } from './ItemRenderer'
import { MatrixGroup } from './widgets/MatrixGroup'
import { MessageBlock } from './widgets/MessageBlock'
import { UnsupportedElement } from './widgets/UnsupportedElement'
import { isItem, isMessage } from './guards'
import { elementKey, sectionChildFallback } from './keys'
import type { AnswerValue, SectionElement } from './types'
import type { RendererStrings } from './StepRenderer'

type Props = {
  sectionKey: string
  section: SectionElement
  locale: string
  answers: Record<string, AnswerValue>
  onAnswer: (key: string, value: AnswerValue) => void
  requiredErrors: string[]
  strings: RendererStrings
}

export function SectionRenderer({ sectionKey, section, locale, answers, onAnswer, requiredErrors, strings }: Props) {
  if (section.shared_option) {
    return (
      <MatrixGroup sectionKey={sectionKey} section={section} locale={locale} answers={answers} onAnswer={onAnswer} requiredErrors={requiredErrors} requiredText={strings.required} unsupportedNotice={strings.unsupported} />
    )
  }
  return (
    <section className="space-y-8">
      {section.title && <h2 tabIndex={-1} className="text-2xl font-semibold leading-snug sm:text-3xl">{section.title}</h2>}
      {section.elements.map((el, j) => {
        const key = elementKey(el, sectionChildFallback(sectionKey, j))
        if (isItem(el)) {
          return <ItemRenderer key={key} answerKey={key} element={el} locale={locale} value={answers[key] ?? null} onAnswer={onAnswer} showRequiredError={requiredErrors.includes(key)} requiredErrorText={strings.required} unsupportedNotice={strings.unsupported} />
        }
        if (isMessage(el)) return <MessageBlock key={key} element={el} locale={locale} />
        return <UnsupportedElement key={key} id={key} reason="unknown section element shape" notice={strings.unsupported} />
      })}
    </section>
  )
}
