import type { Pause } from '../types'
import { SILENCE_RMS, PAUSE_SEC } from '../config'

// 멈춤 판정: tick으로 음량을 받아 무음 구간을 추적하고, finish에서 멈춤 목록을 돌려준다
export function createPauseTracker(opts?: { silenceRms?: number; pauseSec?: number }) {
  const silenceRms = opts?.silenceRms ?? SILENCE_RMS
  const pauseSec = opts?.pauseSec ?? PAUSE_SEC

  let hasHeardSound = false // 첫 소리가 났는지
  let silenceStart: number | null = null // 현재 무음이 시작된 시각
  let pauseCaptured = false // 현재 무음이 이미 멈춤으로 포착됐는지
  let capturedAfterWord = 0 // 포착된 순간의 단어 수
  const pauses: Pause[] = []

  // 소수 첫째 자리로 반올림
  const round1 = (n: number) => Math.round(n * 10) / 10

  function tick(timeMs: number, rms: number, wordCount: number): void {
    const silent = rms < silenceRms

    // 소리가 남: 진행 중이던 무음이 멈춤으로 포착돼 있었다면 확정하고 초기화
    if (!silent) {
      hasHeardSound = true
      if (silenceStart !== null) {
        if (pauseCaptured) {
          pauses.push({ afterWord: capturedAfterWord, sec: round1((timeMs - silenceStart) / 1000) })
        }
        silenceStart = null
        pauseCaptured = false
      }
      return
    }

    // 첫 소리가 나기 전의 무음은 무시
    if (!hasHeardSound) return

    // 무음 시작 시각 기록
    if (silenceStart === null) silenceStart = timeMs

    // pauseSec 이상 이어지면 그 순간의 단어 수를 포착
    if (!pauseCaptured && timeMs - silenceStart >= pauseSec * 1000) {
      pauseCaptured = true
      capturedAfterWord = wordCount
    }
  }

  function finish(finalWordCount: number): Pause[] {
    // 정지할 때 진행 중이던 무음(pauses에 아직 안 들어감)은 자연히 버려진다

    // 같은 afterWord(clamp 후) 병합 + 정렬
    const merged = new Map<number, number>()
    for (const p of pauses) {
      const afterWord = Math.min(p.afterWord, finalWordCount)
      merged.set(afterWord, round1((merged.get(afterWord) ?? 0) + p.sec))
    }

    return Array.from(merged.entries())
      .map(([afterWord, sec]) => ({ afterWord, sec }))
      .sort((a, b) => a.afterWord - b.afterWord)
  }

  return { tick, finish }
}
