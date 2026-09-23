import { describe, it, expect } from 'vitest'
import { createPauseTracker } from './pauseTracker'
import { TICK_MS } from '../config'

// 무음을 50ms 간격으로 count번 채워 넣고, 다음 tick 시각을 돌려준다
function feedSilence(
  tracker: ReturnType<typeof createPauseTracker>,
  start: number,
  count: number,
  wordCount: number,
): number {
  for (let i = 0; i < count; i++) tracker.tick(start + i * TICK_MS, 0, wordCount)
  return start + count * TICK_MS
}

describe('createPauseTracker', () => {
  it('첫 소리가 나기 전의 무음은 무시한다', () => {
    const tracker = createPauseTracker()
    const t = feedSilence(tracker, 0, 30, 0) // 1.5초 무음, 아직 소리 없음
    tracker.tick(t, 1, 0) // 첫 소리
    expect(tracker.finish(0)).toEqual([])
  })

  it('0.9초 무음은 멈춤이 아니다', () => {
    const tracker = createPauseTracker()
    tracker.tick(0, 1, 0) // 소리
    const t = feedSilence(tracker, 50, 18, 0) // 0.9초 무음
    tracker.tick(t, 1, 0) // 소리 재개
    expect(tracker.finish(0)).toEqual([])
  })

  it('1.3초 무음은 sec 1.3이다', () => {
    const tracker = createPauseTracker()
    tracker.tick(0, 1, 2) // 소리, 단어 2개까지 나옴
    const t = feedSilence(tracker, 50, 26, 2) // 1.3초 무음
    tracker.tick(t, 1, 3) // 소리 재개
    expect(tracker.finish(3)).toEqual([{ afterWord: 2, sec: 1.3 }])
  })

  it('정지 직전의 무음은 버린다', () => {
    const tracker = createPauseTracker()
    tracker.tick(0, 1, 2) // 소리
    feedSilence(tracker, 50, 21, 2) // 1.05초 무음 후 소리 재개 없이 정지
    expect(tracker.finish(2)).toEqual([])
  })

  it('같은 틈에 두 번 생긴 멈춤은 합친다', () => {
    const tracker = createPauseTracker()
    tracker.tick(0, 1, 2) // 소리
    let t = feedSilence(tracker, 50, 26, 2) // 1.3초 무음 (첫 번째)
    tracker.tick(t, 1, 2) // 소리 재개, 단어 수 그대로
    t = feedSilence(tracker, t + 50, 26, 2) // 1.3초 무음 (두 번째, 같은 틈)
    tracker.tick(t, 1, 2) // 소리 재개
    expect(tracker.finish(2)).toEqual([{ afterWord: 2, sec: 2.6 }])
  })

  it('afterWord는 최종 단어 수로 맞춘다', () => {
    const tracker = createPauseTracker()
    tracker.tick(0, 1, 10) // 소리, 단어 10개
    const t = feedSilence(tracker, 50, 26, 10) // 1.3초 무음
    tracker.tick(t, 1, 10) // 소리 재개
    expect(tracker.finish(5)).toEqual([{ afterWord: 5, sec: 1.3 }])
  })
})
