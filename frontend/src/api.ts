import type { NewRecord, PracticeRecord, Question, QuestionType } from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// 상태 코드를 함께 들고 다니는 API 오류 (404 화면 구분용)
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

// 공통 요청: 실패하면 응답의 detail, 서버에 닿지 못하면 연결 문구로 던진다
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError('서버에 연결할 수 없습니다', 0)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.detail ?? `요청 실패 (${res.status})`, res.status)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const getQuestions = (type?: QuestionType) =>
  request<Question[]>(type ? `/questions?type=${type}` : '/questions')
export const getQuestion = (id: number | string) => request<Question>(`/questions/${id}`)
export const addQuestion = (type: QuestionType, text: string) =>
  request<Question>('/questions', { method: 'POST', body: JSON.stringify({ type, text }) })
export const deleteQuestion = (id: number) => request<void>(`/questions/${id}`, { method: 'DELETE' })

export const getRecords = () => request<PracticeRecord[]>('/records')
export const getRecord = (id: number | string) => request<PracticeRecord>(`/records/${id}`)
export const saveRecord = (record: NewRecord) =>
  request<PracticeRecord>('/records', { method: 'POST', body: JSON.stringify(record) })
export const deleteRecord = (id: number) => request<void>(`/records/${id}`, { method: 'DELETE' })

// 브라우저 시간대 기준 YYYY-MM-DD HH:mm
export function formatDate(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
