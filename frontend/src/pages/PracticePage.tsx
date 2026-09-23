import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, getQuestion, saveRecord } from '../api'
import { TICK_MS } from '../config'
import { TYPE_NAMES } from '../questionTypes'
import type { Pause, Question } from '../types'
import { speak, stopSpeaking, ttsSupported } from '../speech/tts'
import { createRecognition, recognitionSupported, type SpeechRec } from '../speech/recognition'
import { createPauseTracker } from '../speech/pauseTracker'
import { initialSentenceEnds, splitWords, toggleEnd } from '../selfCheck/analyze'
import TranscriptView from '../components/TranscriptView'
import CountSummary from '../components/CountSummary'

type Phase = 'ready' | 'recording' | 'stopping' | 'check'

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

export default function PracticePage() {
  const { questionId = '' } = useParams()
  const navigate = useNavigate()

  const [question, setQuestion] = useState<Question | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<Phase>('ready')
  const [heard, setHeard] = useState(false)
  const [showText, setShowText] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [finalText, setFinalText] = useState('')
  const [interim, setInterim] = useState('')
  const [transcript, setTranscript] = useState('')
  const [pauses, setPauses] = useState<Pause[]>([])
  const [ends, setEnds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  // 녹음 중 바뀌는 값은 ref로 들고 있어 콜백이 옛 값을 읽지 않게 한다
  const recordingRef = useRef(false)
  const recRef = useRef<SpeechRec | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const trackerRef = useRef<ReturnType<typeof createPauseTracker> | null>(null)
  const liveTextRef = useRef('')

  // 질문 불러오기
  useEffect(() => {
    let cancelled = false
    getQuestion(questionId)
      .then((q) => !cancelled && setQuestion(q))
      .catch((e: ApiError) => {
        if (cancelled) return
        if (e.status === 404) setNotFound(true)
        else setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [questionId])

  // 화면을 떠나면 마이크, 인식, 타이머, TTS를 모두 멈춘다
  useEffect(
    () => () => {
      recordingRef.current = false
      recRef.current?.abort()
      releaseAudio()
      stopSpeaking()
    },
    [],
  )

  // 타이머, 마이크 트랙, AudioContext 정리
  function releaseAudio() {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    ctxRef.current?.close()
    ctxRef.current = null
  }

  async function startRecording() {
    setError('')
    stopSpeaking()

    // 마이크 권한
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('마이크 권한이 필요합니다')
      return
    }
    streamRef.current = stream

    // 화면 초기화
    liveTextRef.current = ''
    setFinalText('')
    setInterim('')
    setElapsed(0)
    recordingRef.current = true
    setPhase('recording')

    // 음량 측정: TICK_MS마다 RMS를 멈춤 판정기에 넘긴다
    const ctx = new AudioContext()
    ctxRef.current = ctx
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    ctx.createMediaStreamSource(stream).connect(analyser)
    const buf = new Float32Array(analyser.fftSize)
    const tracker = createPauseTracker()
    trackerRef.current = tracker
    const startedAt = performance.now()
    timerRef.current = window.setInterval(() => {
      analyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (const v of buf) sum += v * v
      const now = performance.now()
      tracker.tick(now, Math.sqrt(sum / buf.length), splitWords(liveTextRef.current).length)
      setElapsed(Math.floor((now - startedAt) / 1000))
    }, TICK_MS)

    // STT 시작
    const rec = createRecognition(
      (fin, int) => {
        liveTextRef.current = fin + ' ' + int
        setFinalText(fin)
        setInterim(int)
      },
      (message) => {
        setError(message)
        stopRecording()
      },
    )
    recRef.current = rec
    rec.start()
  }

  async function stopRecording() {
    if (!recordingRef.current) return
    recordingRef.current = false
    setPhase('stopping')
    clearInterval(timerRef.current)

    // 마지막 글 확정(최대 2초) 후 마이크 정리
    const text = await recRef.current!.stop()
    releaseAudio()
    setInterim('')

    // 인식된 말이 없으면 다시 녹음할 수 있게 둔다
    if (!text) {
      setError((prev) => prev || '인식된 말이 없습니다')
      setPhase('ready')
      return
    }

    // 자가진단으로 전환
    const words = splitWords(text)
    setTranscript(text)
    setPauses(trackerRef.current!.finish(words.length))
    setEnds(initialSentenceEnds(words))
    setPhase('check')
  }

  async function save() {
    if (!question) return
    setSaving(true)
    setError('')
    try {
      const r = await saveRecord({
        questionType: question.type,
        questionText: question.text,
        transcript,
        pauses,
        sentenceEnds: ends,
      })
      navigate(`/records/${r.id}`)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  // 결과를 버리고 녹음 전으로
  function retry() {
    setError('')
    setFinalText('')
    setInterim('')
    setElapsed(0)
    setPhase('ready')
  }

  if (notFound)
    return (
      <div className="card">
        <p className="error">질문을 찾을 수 없습니다</p>
        <Link to="/">질문 선택으로 돌아가기</Link>
      </div>
    )

  const recording = phase === 'recording'

  return (
    <>
      {error && (
        <div className="card">
          <p className="error">{error}</p>
        </div>
      )}

      {question && (
        <>
          <h1 className="title">{TYPE_NAMES[question.type]}</h1>

          {phase === 'check' ? (
            <div className="stack">
              <CountSummary pauses={pauses} sentenceEnds={ends} />
              <div className="card stack">
                <p className="sub">Chrome은 문장 부호를 거의 찍지 않습니다. 문장이 끝난 단어를 눌러 표시하세요.</p>
                <TranscriptView
                  transcript={transcript}
                  pauses={pauses}
                  sentenceEnds={ends}
                  onToggle={(gap) => setEnds((prev) => toggleEnd(prev, gap))}
                />
              </div>
              <button className="btn btn-secondary" onClick={retry}>다시 하기</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? '저장 중' : '저장'}
              </button>
            </div>
          ) : (
            <div className="stack">
              <div className="row">
                <button
                  className="btn btn-secondary"
                  disabled={!ttsSupported || phase !== 'ready'}
                  onClick={() => {
                    speak(question.text)
                    setHeard(true)
                  }}
                >
                  {heard ? '다시 듣기' : '듣기'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowText((v) => !v)}>
                  {showText ? '질문 숨기기' : '질문 보기'}
                </button>
              </div>
              {showText && <div className="card">{question.text}</div>}

              <div className="card timer">
                <span className="big-number">{mmss(elapsed)}</span>
                {recording && <span className="rec-dot" aria-label="녹음 중" />}
              </div>

              {(finalText || interim) && (
                <div className="card transcript">
                  {finalText} <span className="interim">{interim}</span>
                </div>
              )}

              {!recognitionSupported && (
                <p className="sub">이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Safari를 사용하세요.</p>
              )}
              <button
                className={`btn btn-primary${recording ? ' recording' : ''}`}
                disabled={!recognitionSupported || phase === 'stopping'}
                onClick={recording ? stopRecording : startRecording}
              >
                {recording ? '정지' : phase === 'stopping' ? '정리 중' : '녹음 시작'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
