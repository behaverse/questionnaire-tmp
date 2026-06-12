import type { ReactNode } from 'react'
import { deriveWidget } from './derive'
import { mergeOptions } from './merge'
import { RenderError, type AnswerValue, type ItemElement } from './types'
import { CheckboxGroup } from './widgets/CheckboxGroup'
import { NumberInput } from './widgets/NumberInput'
import { RadioGroup } from './widgets/RadioGroup'
import { TextInput } from './widgets/TextInput'
import { UnsupportedElement } from './widgets/UnsupportedElement'

export type ItemRendererProps = {
  answerKey: string
  element: ItemElement
  locale: string
  value: AnswerValue
  onAnswer: (key: string, value: AnswerValue) => void
  keyHints?: boolean
  showRequiredError?: boolean
  requiredErrorText?: string
  errorMessage?: string
  unsupportedNotice?: string
}

export function ItemRenderer({ answerKey, element, locale, value, onAnswer, keyHints = false, showRequiredError = false, requiredErrorText = '', errorMessage, unsupportedNotice = '' }: ItemRendererProps) {
  const prompt = element.question.prompt?.content?.[locale]?.text ?? ''
  const context = element.question.context?.content?.[locale]?.text
  const instruction = element.question.instruction?.content?.[locale]?.text
  const kind = deriveWidget(element.option)

  let widget: ReactNode
  if (!kind) {
    const triple = `${element.option.input_data_type}/${element.option.measurement_type}/${element.option.selection ?? '—'}`
    widget = <UnsupportedElement id={answerKey} reason={triple} notice={unsupportedNotice} />
  } else {
    try {
      if (kind.startsWith('choice.') && kind.endsWith('.single')) {
        widget = <RadioGroup name={answerKey} label={prompt} choices={mergeOptions(element.option, locale)} value={value} onChange={(v) => onAnswer(answerKey, v)} keyHints={keyHints} />
      } else if (kind === 'choice.nominal.multiple') {
        widget = <CheckboxGroup label={prompt} choices={mergeOptions(element.option, locale)} value={value} onChange={(v) => onAnswer(answerKey, v)} />
      } else if (kind.startsWith('number.')) {
        widget = <NumberInput label={prompt} min={element.option.min} max={element.option.max} step={element.option.step} value={value} onChange={(v) => onAnswer(answerKey, v)} />
      } else {
        widget = <TextInput label={prompt} placeholder={element.option.content?.[locale]?.label} value={value} onChange={(v) => onAnswer(answerKey, v)} />
      }
    } catch (err) {
      if (!(err instanceof RenderError)) throw err
      widget = <UnsupportedElement id={answerKey} reason={err.message} notice={unsupportedNotice} />
    }
  }

  const errorId = `${answerKey}-error`
  // A validation message (errorMessage) overrides the generic required text and shows even when the
  // key is not in stepErrors; a key in stepErrors with no message falls back to the generic text.
  const shownError = errorMessage ?? (showRequiredError ? requiredErrorText : undefined)
  return (
    <fieldset aria-describedby={shownError ? errorId : undefined} className="space-y-5">
      <legend className="sr-only">{prompt}</legend>
      <div className="space-y-2">
        <h2 tabIndex={-1} className="text-2xl font-semibold leading-snug sm:text-3xl">{prompt}</h2>
        {context && <p className="text-base text-slate-500">{context}</p>}
        {instruction && <p className="text-sm italic text-slate-500">{instruction}</p>}
      </div>
      {widget}
      {shownError && (
        <p id={errorId} className="font-medium text-error" role="alert">{shownError}</p>
      )}
    </fieldset>
  )
}
