import { describe, it, expect } from 'vitest'
import { splitWords, initialSentenceEnds, gapMark, countKinds, toggleEnd } from './analyze'
import type { Pause } from '../types'

describe('splitWords', () => {
  it('빈 문자열은 빈 배열', () => {
    expect(splitWords('')).toEqual([])
  })
  it('앞뒤 공백을 없앤다', () => {
    expect(splitWords('  hello world  ')).toEqual(['hello', 'world'])
  })
  it('여러 공백을 하나로 본다', () => {
    expect(splitWords('hello   world')).toEqual(['hello', 'world'])
  })
})

describe('initialSentenceEnds', () => {
  it('문장 부호로 끝난 단어 뒤 틈을 문장 끝으로 잡는다', () => {
    // I like it. It is nice. -> ends at gap 3 (like it.는 아님, "it." 뒤)
    const words = ['I', 'like', 'it.', 'It', 'is', 'nice.']
    expect(initialSentenceEnds(words)).toEqual([3])
  })
  it('마지막 틈은 문장 부호로 끝나도 제외한다', () => {
    const words = ['Hello', 'world.']
    expect(initialSentenceEnds(words)).toEqual([])
  })
  it('? ! 도 문장 끝으로 본다', () => {
    const words = ['Really?', 'Wow!', 'ok']
    expect(initialSentenceEnds(words)).toEqual([1, 2])
  })
  it('문장 부호가 없으면 빈 배열', () => {
    expect(initialSentenceEnds(['no', 'punctuation', 'here'])).toEqual([])
  })
})

describe('gapMark', () => {
  const pauses: Pause[] = [
    { afterWord: 2, sec: 1.3 },
    { afterWord: 5, sec: 2.1 },
  ]
  const sentenceEnds = [2, 4]

  it('문장 끝에 멈춤이 있으면 end', () => {
    expect(gapMark(2, pauses, sentenceEnds)).toEqual({ kind: 'end', sec: 1.3 })
  })
  it('문장 끝이 아닌 곳에 멈춤이 있으면 mid', () => {
    expect(gapMark(5, pauses, sentenceEnds)).toEqual({ kind: 'mid', sec: 2.1 })
  })
  it('문장 끝인데 멈춤이 없으면 missed', () => {
    expect(gapMark(4, pauses, sentenceEnds)).toEqual({ kind: 'missed' })
  })
  it('문장 끝도 아니고 멈춤도 없으면 null', () => {
    expect(gapMark(0, pauses, sentenceEnds)).toBeNull()
  })
})

describe('countKinds', () => {
  it('세 분류 개수를 센다', () => {
    const pauses: Pause[] = [
      { afterWord: 2, sec: 1.3 }, // end
      { afterWord: 5, sec: 2.1 }, // mid
    ]
    const sentenceEnds = [2, 4] // 4는 멈춤 없음 -> missed
    expect(countKinds(pauses, sentenceEnds)).toEqual({ end: 1, mid: 1, missed: 1 })
  })
  it('멈춤과 문장 끝이 없으면 모두 0', () => {
    expect(countKinds([], [])).toEqual({ end: 0, mid: 0, missed: 0 })
  })
})

describe('toggleEnd', () => {
  it('없는 틈이면 추가한다', () => {
    expect(toggleEnd([2, 5], 3)).toEqual([2, 3, 5])
  })
  it('있는 틈이면 제거한다', () => {
    expect(toggleEnd([2, 3, 5], 3)).toEqual([2, 5])
  })
  it('정렬된 상태로 돌려준다', () => {
    expect(toggleEnd([5, 2], 1)).toEqual([1, 2, 5])
  })
})
