import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, formatDate, getRecords } from '../api'
import type { PracticeRecord } from '../types'
import { TYPE_NAMES } from '../questionTypes'
import { countKinds } from '../selfCheck/analyze'

export default function RecordListPage() {
  const [records, setRecords] = useState<PracticeRecord[] | null>(null)
  const [error, setError] = useState('')

  // 기록 목록 불러오기 (최신순은 서버가 정렬해서 준다)
  useEffect(() => {
    let cancelled = false
    getRecords()
      .then((data) => {
        if (!cancelled) setRecords(data)
      })
      .catch((err: ApiError) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <h1 className="title">기록</h1>

      {error && (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      )}

      {records === null ? null : records.length === 0 ? (
        <p className="empty">아직 기록이 없습니다</p>
      ) : (
        <div className="list">
          {records.map((r) => {
            const { end, mid, missed } = countKinds(r.pauses, r.sentenceEnds)
            const question =
              r.questionText.length > 60 ? `${r.questionText.slice(0, 60)}…` : r.questionText
            return (
              <Link key={r.id} className="list-item" to={`/records/${r.id}`}>
                <div className="grow">
                  <p className="sub">{formatDate(r.createdAt)}</p>
                  <p className="list-type">{TYPE_NAMES[r.questionType]}</p>
                  <p>{question}</p>
                  <p className="sub">
                    <span className="c-end" aria-label={`문장 끝 멈춤 ${end}개`}>
                      ⏸ {end}
                    </span>{' '}
                    <span className="c-mid" aria-label={`문장 중간 멈춤 ${mid}개`}>
                      ⏸ {mid}
                    </span>{' '}
                    <span className="c-missed" aria-label={`쉬지 않은 문장 끝 ${missed}개`}>
                      ⚠ {missed}
                    </span>
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
