export type QuestionType =
  | 'INTRO' | 'DESCRIBE' | 'ROUTINE' | 'PAST' | 'COMPARE' | 'ROLEPLAY' | 'UNEXPECTED'

export interface Question {
  id: number
  type: QuestionType
  text: string
  isDefault: boolean
}

export interface Pause {
  afterWord: number
  sec: number
}

export interface PracticeRecord {
  id: number
  questionType: QuestionType
  questionText: string
  transcript: string
  pauses: Pause[]
  sentenceEnds: number[]
  createdAt: string
}

export type NewRecord = Omit<PracticeRecord, 'id' | 'createdAt'>
