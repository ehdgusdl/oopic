import type { Pause } from '../types'
import { splitWords, gapMark, type GapMark } from '../selfCheck/analyze'

interface Props {
  transcript: string
  pauses: Pause[]
  sentenceEnds: number[]
  onToggle?: (gap: number) => void
}

// 멈춤 표시가 들어간 글. 틈마다 표시, 단어마다 누를 수 있는 글자(onToggle 있을 때)
export default function TranscriptView({ transcript, pauses, sentenceEnds, onToggle }: Props) {
  const words = splitWords(transcript)

  return (
    <div className="transcript">
      {words.map((word, i) => {
        const gap = i // 단어 i 앞의 틈
        const mark = gapMark(gap, pauses, sentenceEnds)
        return (
          <span key={i}>
            {renderMark(gap, mark, sentenceEnds)}
            {onToggle ? (
              <button type="button" className="word" onClick={() => onToggle(i + 1)}>
                {word}
              </button>
            ) : (
              <span className="word">{word}</span>
            )}{' '}
          </span>
        )
      })}
      {renderMark(words.length, gapMark(words.length, pauses, sentenceEnds), sentenceEnds)}
    </div>
  )
}

// 틈 하나의 표시(문장 끝 선, 멈춤 배지)를 렌더링
function renderMark(gap: number, mark: GapMark, sentenceEnds: number[]) {
  const isEnd = sentenceEnds.includes(gap)
  return (
    <>
      {isEnd && <span className="sentence-bar">|</span>}
      {mark?.kind === 'end' && (
        <span className="badge c-end" aria-label={`문장 끝 멈춤 ${mark.sec}초`}>
          ⏸{mark.sec}s
        </span>
      )}
      {mark?.kind === 'mid' && (
        <span className="badge c-mid" aria-label="문장 중간 멈춤">
          ⏸{mark.sec}s
        </span>
      )}
      {mark?.kind === 'missed' && (
        <span className="badge c-missed" aria-label="쉬지 않은 문장 끝">
          ⚠
        </span>
      )}
    </>
  )
}
