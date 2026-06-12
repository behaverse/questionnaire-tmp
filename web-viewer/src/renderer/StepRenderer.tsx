import { ItemRenderer } from './ItemRenderer'
import { SectionRenderer } from './SectionRenderer'
import { MessageBlock } from './widgets/MessageBlock'
import { UnsupportedElement } from './widgets/UnsupportedElement'
import { isItem, isMessage, isSection } from './guards'
import type { AnswerValue, RuntimeElement } from './types'

export type RendererStrings = { required: string; unsupported: string }
export type StepRendererProps = {
  elements: { key: string; element: RuntimeElement }[]
  locale: string
  answers: Record<string, AnswerValue>
  onAnswer: (key: string, value: AnswerValue) => void
  requiredErrors: string[]
  errorMessages?: Record<string, string>
  strings: RendererStrings
  keyHints?: boolean
}

export function StepRenderer({ elements, locale, answers, onAnswer, requiredErrors, errorMessages = {}, strings, keyHints = false }: StepRendererProps) {
  return (
    <div className="space-y-10">
      {elements.map(({ key, element }) => {
        if (isItem(element)) {
          return <ItemRenderer key={key} answerKey={key} element={element} locale={locale} value={answers[key] ?? null} onAnswer={onAnswer} keyHints={keyHints} showRequiredError={requiredErrors.includes(key)} requiredErrorText={strings.required} errorMessage={errorMessages[key]} unsupportedNotice={strings.unsupported} />
        }
        if (isSection(element)) {
          return <SectionRenderer key={key} sectionKey={key} section={element} locale={locale} answers={answers} onAnswer={onAnswer} requiredErrors={requiredErrors} errorMessages={errorMessages} strings={strings} />
        }
        if (isMessage(element)) return <MessageBlock key={key} element={element} locale={locale} />
        return <UnsupportedElement key={key} id={key} reason="unknown element shape" notice={strings.unsupported} />
      })}
    </div>
  )
}
