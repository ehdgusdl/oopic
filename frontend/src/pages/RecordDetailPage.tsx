import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, deleteRecord, formatDate, getRecord } from '../api'
import type { PracticeRecord } from '../types'
import { TYPE_NAMES } from '../questionTypes'
import CountSummary from '../components/CountSummary'
import TranscriptView from '../components/TranscriptView'

export default function RecordDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<PracticeRecord | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  // 기록 하나 불러오기. 404면 안내 문구로 전환
  useEffect(() => {
    if (!id) return
    let cancelled = false
    getRecord(id)
      .then((data) => {
        if (!cancelled) setRecord(data)
      })
      .catch((err: ApiError) => {
        if (cancelled) return
        if (err.status === 404) setNotFound(true)
        else setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // 기록 삭제: confirm 후 삭제, 성공하면 목록으로 이동
  async function handleDelete() {
    if (!record || !window.confirm('이 기록을 삭제할까요?')) return
    try {
      await deleteRecord(record.id)
      navigate('/records')
    } catch (err) {
      setError((err as ApiError).message)
    }
  }

  if (notFound) {
    return (
      <>
        <p className="empty">기록을 찾을 수 없습니다</p>
        <Link to="/records">목록으로</Link>
      </>
    )
  }

  return (
    <>
      <h1 className="title">기록 상세</h1>

      {error && (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      )}

      {record && (
        <>
          <div className="card stack">
            <p className="sub">{formatDate(record.createdAt)}</p>
            <p className="list-type">{TYPE_NAMES[record.questionType]}</p>
            <p>{record.questionText}</p>
          </div>

          <div className="section">
            <CountSummary pauses={record.pauses} sentenceEnds={record.sentenceEnds} />
          </div>

          <div className="card section">
            <TranscriptView
              transcript={record.transcript}
              pauses={record.pauses}
              sentenceEnds={record.sentenceEnds}
            />
          </div>

          <div className="section">
            <button className="btn btn-danger-text" onClick={handleDelete}>
              삭제
            </button>
          </div>
        </>
      )}
    </>
  )
}
