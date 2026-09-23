export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

// 읽는 중이면 멈추고 처음부터 다시 읽는다
export function speak(text: string) {
  if (!ttsSupported) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 1.0
  speechSynthesis.speak(u)
}

export function stopSpeaking() {
  if (ttsSupported) speechSynthesis.cancel()
}
