import type { Pause } from '../types'

// 전사 글을 단어로 나눈다. 빈 문자열은 빈 배열
export function splitWords(transcript: string): string[] {
  const trimmed = transcript.trim()
  return trimmed === '' ? [] : trimmed.split(/\s+/)
}

// 문장 부호(. ? !)로 끝난 단어 뒤 틈을 문장 끝으로 잡는다. 마지막 틈은 제외
export function initialSentenceEnds(words: string[]): number[] {
  const ends: number[] = []
  for (let k = 0; k < words.length - 1; k++) {
    if (/[.?!]$/.test(words[k])) ends.push(k + 1)
  }
  return ends
}

export type GapMark = { kind: 'end' | 'mid'; sec: number } | { kind: 'missed' } | null

// 틈 하나를 문장 끝 멈춤/문장 중간 멈춤/쉬지 않은 문장 끝/해당 없음으로 분류
export function gapMark(gap: number, pauses: Pause[], sentenceEnds: number[]): GapMark {
  const pause = pauses.find((p) => p.afterWord === gap)
  const isEnd = sentenceEnds.includes(gap)
  if (pause && isEnd) return { kind: 'end', sec: pause.sec }
  if (pause) return { kind: 'mid', sec: pause.sec }
  if (isEnd) return { kind: 'missed' }
  return null
}

// 전체 멈춤과 문장 끝을 세 분류 개수로 센다
export function countKinds(pauses: Pause[], sentenceEnds: number[]): { end: number; mid: number; missed: number } {
  let end = 0
  let mid = 0
  for (const p of pauses) {
    if (sentenceEnds.includes(p.afterWord)) end++
    else mid++
  }
  const missed = sentenceEnds.filter((gap) => !pauses.some((p) => p.afterWord === gap)).length
  return { end, mid, missed }
}

// 틈의 문장 끝 표시를 켜고 끈다
export function toggleEnd(sentenceEnds: number[], gap: number): number[] {
  const next = sentenceEnds.includes(gap)
    ? sentenceEnds.filter((g) => g !== gap)
    : [...sentenceEnds, gap]
  return next.sort((a, b) => a - b)
}
