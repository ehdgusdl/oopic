import { useEffect, useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { addQuestion, ApiError, deleteQuestion, getQuestions } from '../api'
import type { Question, QuestionType } from '../types'
import { TYPE_NAMES, TYPES } from '../questionTypes'

export default function QuestionPage() {
  const navigate = useNavigate()
  const [type, setType] = useState<QuestionType | ''>('')
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [error, setError] = useState('')
  const [formType, setFormType] = useState<QuestionType>(TYPES[0])
  const [formText, setFormText] = useState('')
  // 추가/삭제 후 값을 올려 목록을 다시 불러온다
  const [reloadKey, setReloadKey] = useState(0)

  // 필터가 바뀌거나 추가/삭제하면 목록을 새로 불러온다 (전체면 type 없이 호출)
  useEffect(() => {
    let cancelled = false
    getQuestions(type || undefined)
      .then((data) => {
        if (cancelled) return
        setQuestions(data)
        setError('')
      })
      .catch((err: ApiError) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [type, reloadKey])

  const trimmedLen = formText.trim().length
  const canAdd = trimmedLen >= 1 && trimmedLen <= 300

  // 질문 추가: 성공하면 폼을 비우고 목록을 다시 불러온다
  async function handleAdd() {
    try {
      await addQuestion(formType, formText.trim())
      setFormText('')
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError((err as ApiError).message)
    }
  }

  // 질문 삭제: confirm 후 삭제, 목록 클릭으로 이어지지 않게 stopPropagation
  async function handleDelete(e: MouseEvent, id: number) {
    e.stopPropagation()
    if (!window.confirm('이 질문을 삭제할까요?')) return
    try {
      await deleteQuestion(id)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError((err as ApiError).message)
    }
  }

  // 랜덤 출제: 현재 목록에서 하나 골라 바로 이동
  function handleRandom() {
    if (!questions?.length) return
    const picked = questions[Math.floor(Math.random() * questions.length)]
    navigate(`/practice/${picked.id}`)
  }

  return (
    <>
      <h1 className="title">질문 선택</h1>

      {error && (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      )}

      <div className="card stack">
        <select value={formType} onChange={(e) => setFormType(e.target.value as QuestionType)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_NAMES[t]}
            </option>
          ))}
        </select>
        <textarea
          value={formText}
          onChange={(e) => setFormText(e.target.value)}
          placeholder="질문을 입력하세요 (1~300자)"
        />
        <button className="btn btn-secondary" disabled={!canAdd} onClick={handleAdd}>
          추가
        </button>
      </div>

      <div className="section">
        <div className="chips">
          <button className={`chip ${type === '' ? 'selected' : ''}`} onClick={() => setType('')}>
            전체
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              className={`chip ${type === t ? 'selected' : ''}`}
              onClick={() => setType(t)}
            >
              {TYPE_NAMES[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        {questions === null ? null : questions.length === 0 ? (
          <p className="empty">질문이 없습니다</p>
        ) : (
          <div className="list">
            {questions.map((q) => (
              <div
                key={q.id}
                className="list-item"
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/practice/${q.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/practice/${q.id}`)}
              >
                <div className="grow">
                  <p className="list-type">{TYPE_NAMES[q.type]}</p>
                  <p>{q.text}</p>
                </div>
                {!q.isDefault && (
                  <button className="btn-danger-text" onClick={(e) => handleDelete(e, q.id)}>
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn btn-primary" disabled={!questions?.length} onClick={handleRandom}>
        랜덤 출제
      </button>
    </>
  )
}
