import type { Pause } from '../types'
import { countKinds } from '../selfCheck/analyze'

interface Props {
  pauses: Pause[]
  sentenceEnds: number[]
}

// 세 분류(문장 끝 멈춤/문장 중간 멈춤/쉬지 않은 문장 끝)의 개수를 카드로 보여 준다
export default function CountSummary({ pauses, sentenceEnds }: Props) {
  const { end, mid, missed } = countKinds(pauses, sentenceEnds)

  return (
    <div className="card">
      <div className="summary">
        <div>
          <div className="big-number c-end">{end}</div>
          <div className="label">문장 끝 멈춤</div>
        </div>
        <div>
          <div className="big-number c-mid">{mid}</div>
          <div className="label">문장 중간 멈춤</div>
        </div>
        <div>
          <div className="big-number c-missed">{missed}</div>
          <div className="label">쉬지 않은 문장 끝</div>
        </div>
      </div>
    </div>
  )
}
