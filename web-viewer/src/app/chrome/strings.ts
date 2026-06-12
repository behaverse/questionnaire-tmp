const STRINGS = {
  en: {
    next: 'Next', back: 'Back', enter_hint: 'press Enter ↵',
    progress: 'Question {i} of {n}',
    required_error: 'Please answer this question to continue.',
    error_invalid_link_title: 'This link is not valid',
    error_invalid_link_body: 'Check that the address was copied completely, or contact the study team.',
    error_not_open_title: 'Not currently accepting responses',
    error_not_open_body: 'This questionnaire is not open right now. Please try again later or contact the study team.',
    error_closed_title: 'This questionnaire has closed',
    error_closed_body: 'The collection period for this study has ended. Thank you for your interest.',
    error_failed_title: 'Something went wrong',
    error_failed_body: 'We could not start your session. Please check your connection and try again.',
    retry: 'Try again',
    finished_title: 'Thank you!',
    finished_body: 'You have reached the end of this questionnaire.',
    unsupported: 'This element cannot be displayed by this viewer.',
  },
  pt: {
    next: 'Seguinte', back: 'Voltar', enter_hint: 'prima Enter ↵',
    progress: 'Pergunta {i} de {n}',
    required_error: 'Por favor responda a esta pergunta para continuar.',
    error_invalid_link_title: 'Esta ligação não é válida',
    error_invalid_link_body: 'Verifique se o endereço foi copiado na íntegra ou contacte a equipa do estudo.',
    error_not_open_title: 'De momento não aceita respostas',
    error_not_open_body: 'Este questionário não está aberto neste momento. Tente novamente mais tarde ou contacte a equipa do estudo.',
    error_closed_title: 'Este questionário foi encerrado',
    error_closed_body: 'O período de recolha deste estudo terminou. Obrigado pelo seu interesse.',
    error_failed_title: 'Algo correu mal',
    error_failed_body: 'Não foi possível iniciar a sessão. Verifique a ligação e tente novamente.',
    retry: 'Tentar novamente',
    finished_title: 'Obrigado!',
    finished_body: 'Chegou ao fim deste questionário.',
    unsupported: 'Este elemento não pode ser apresentado por este visualizador.',
  },
} as const

export type StringKey = keyof (typeof STRINGS)['en']

export function t(locale: string, key: StringKey, vars: Record<string, string | number> = {}): string {
  const lang = locale.split('-')[0]
  const table: Record<StringKey, string> = (STRINGS as Record<string, Record<StringKey, string> | undefined>)[lang] ?? STRINGS.en
  let s: string = table[key] ?? STRINGS.en[key]
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
  return s
}
