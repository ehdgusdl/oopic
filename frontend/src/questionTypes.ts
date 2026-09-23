import type { QuestionType } from './types'

export const TYPE_NAMES: Record<QuestionType, string> = {
  INTRO: '자기소개',
  DESCRIBE: '묘사',
  ROUTINE: '루틴',
  PAST: '과거 경험',
  COMPARE: '비교/변화',
  ROLEPLAY: '롤플레이',
  UNEXPECTED: '돌발 주제',
}

export const TYPES = Object.keys(TYPE_NAMES) as QuestionType[]
