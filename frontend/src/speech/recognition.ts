// 브라우저 SpeechRecognition 중 쓰는 부분만 선언 (lib.dom에 없음)
interface RecognitionResult { isFinal: boolean; 0: { transcript: string } }
interface RecognitionEvent { results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {}
const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => Recognition) | undefined

export const recognitionSupported = !!Ctor

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim()

// 녹음 중 계속 듣는 STT. 저절로 끝나면 다시 시작하고, 확정 글은 이어 붙인다
export function createRecognition(
  onUpdate: (finalText: string, interim: string) => void,
  onError: (message: string) => void,
) {
  const rec = new Ctor!()
  rec.lang = 'en-US'
  rec.continuous = true
  rec.interimResults = true

  let committed = '' // 이전 세션들의 확정 글
  let sessionFinal = '' // 지금 세션의 확정 글
  let recording = false
  let running = false
  let onEnded: (() => void) | null = null

  const finalText = () => tidy(committed + ' ' + sessionFinal)

  // 세션 안의 결과 전체를 다시 훑어 확정/인식 중 글을 만든다
  rec.onresult = (e) => {
    let fin = ''
    let interim = ''
    for (let i = 0; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) fin += ' ' + r[0].transcript
      else interim += ' ' + r[0].transcript
    }
    sessionFinal = fin
    onUpdate(finalText(), tidy(interim))
  }

  // no-speech, aborted는 무시(end에서 재시작), 그 밖은 안내 후 정지
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return
    recording = false
    if (e.error === 'not-allowed') onError('마이크 권한이 필요합니다')
    else if (e.error === 'network') onError('인터넷 연결을 확인하세요')
    else onError(`음성 인식 오류: ${e.error}`)
  }

  // 세션이 끝나면 확정 글을 넘기고, 녹음 중이면 다시 시작한다
  rec.onend = () => {
    running = false
    committed = finalText()
    sessionFinal = ''
    onUpdate(committed, '')
    if (recording) {
      try {
        rec.start()
        running = true
      } catch {
        // 이미 시작된 경우
      }
    } else onEnded?.()
  }

  return {
    start() {
      recording = true
      rec.start()
      running = true
    },
    // stop 후 end를 최대 2초 기다려 확정 글을 돌려준다
    stop(): Promise<string> {
      recording = false
      if (!running) return Promise.resolve(finalText())
      return new Promise((resolve) => {
        const done = () => {
          clearTimeout(timer)
          onEnded = null
          resolve(finalText())
        }
        const timer = setTimeout(done, 2000)
        onEnded = done
        rec.stop()
      })
    },
    // 화면을 떠날 때: 결과 없이 바로 끝낸다
    abort() {
      recording = false
      rec.abort()
    },
  }
}

export type SpeechRec = ReturnType<typeof createRecognition>
