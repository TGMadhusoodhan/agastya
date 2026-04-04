// src/utils/voiceEngine.js
// Robust Web Speech API wrapper — handles Linux/Chrome quirks

const LANGUAGE_VOICE_MAP = {
  English: 'en-US',
  Hindi:   'hi-IN',
  Tamil:   'ta-IN',
  Kannada: 'kn-IN',
  Spanish: 'es-ES',
  Mandarin: 'zh-CN',
  French:  'fr-FR',
  Arabic:  'ar-SA',
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function isSpeaking() {
  return window.speechSynthesis?.speaking || false
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

// ── Get all available voices ─────────────────────────────────────────────
export function getAvailableVoices() {
  if (!isSpeechSupported()) return []
  return window.speechSynthesis.getVoices()
}

// ── Find best matching voice for a language code ─────────────────────────
// Priority: Google cloud voice > other network voice > local voice
// Google voices (e.g. "Google US English") sound natural; espeak is robotic.
function pickVoice(langCode) {
  const voices = getAvailableVoices()
  if (voices.length === 0) return null

  const lang2 = langCode.split('-')[0]  // e.g. 'ta' from 'ta-IN'

  const score = (v) => {
    const isGoogle  = v.name.toLowerCase().includes('google')
    const isNetwork = !v.localService
    const exactLang = v.lang === langCode
    const familyLang = v.lang.startsWith(lang2)
    const isEnFallback = v.lang.startsWith('en')

    if (exactLang  && isGoogle)  return 100
    if (exactLang  && isNetwork) return 90
    if (exactLang)               return 80
    if (familyLang && isGoogle)  return 70
    if (familyLang && isNetwork) return 60
    if (familyLang)              return 50
    if (isEnFallback && isGoogle)  return 30
    if (isEnFallback && isNetwork) return 20
    if (isEnFallback)              return 10
    return 0
  }

  return voices.slice().sort((a, b) => score(b) - score(a))[0] || null
}

// ── Core speak function ───────────────────────────────────────────────────
// Returns a Promise that resolves when speech ends, or rejects on error.
// Handles the Chrome/Linux bugs:
//   1. voices not loaded yet  → wait for onvoiceschanged
//   2. speak() after cancel() can silently fail → wrap in setTimeout
//   3. speechSynthesis.paused bug in Chrome → resume before speaking
export function speak(text, language = 'English') {
  if (!isSpeechSupported()) return false

  const langCode = LANGUAGE_VOICE_MAP[language] || 'en-US'

  const doSpeak = () => {
    // Chrome bug: cancel() can leave synthesis in a broken state.
    // Always cancel first, then use setTimeout(0) before the new speak().
    window.speechSynthesis.cancel()

    setTimeout(() => {
      // Chrome can get paused; resume it first
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      const utterance      = new SpeechSynthesisUtterance(text)
      const voice          = pickVoice(langCode)
      if (voice) utterance.voice = voice
      utterance.lang       = voice?.lang || langCode
      // Google voices: natural at 0.95 rate; espeak needs slower 0.82
      const isGoogle = voice?.name?.toLowerCase().includes('google')
      utterance.rate       = isGoogle ? 0.95 : 0.82
      utterance.pitch      = isGoogle ? 1.05 : 1.0
      utterance.volume     = 1.0

      utterance.onerror = (e) => {
        // 'interrupted' happens when cancel() is called — not a real error
        if (e.error !== 'interrupted') {
          console.warn('SpeechSynthesis error:', e.error)
        }
      }

      window.speechSynthesis.speak(utterance)

      // Chrome long-utterance bug: Chrome stops synthesizing after ~15s.
      // Workaround: pause+resume every 10 seconds to keep it going.
      const keepAlive = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(keepAlive)
          return
        }
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }, 10_000)

      utterance.onend = () => clearInterval(keepAlive)
    }, 50) // 50ms delay — enough for cancel() to fully clear
  }

  const voices = getAvailableVoices()

  if (voices.length === 0) {
    // Voices not loaded yet — wait for them (with a 3s timeout fallback)
    let fired = false

    const onVoicesChanged = () => {
      if (fired) return
      fired = true
      window.speechSynthesis.onvoiceschanged = null
      doSpeak()
    }

    window.speechSynthesis.onvoiceschanged = onVoicesChanged

    // Timeout: if onvoiceschanged never fires (common on Linux when
    // no TTS engine is installed), try anyway after 3s
    setTimeout(() => {
      if (!fired) {
        fired = true
        window.speechSynthesis.onvoiceschanged = null
        if (getAvailableVoices().length > 0) {
          doSpeak()
        } else {
          console.warn(
            'No TTS voices found. On Linux, install espeak-ng:\n' +
            '  sudo pacman -S espeak-ng speech-dispatcher\n' +
            '  systemctl --user enable --now speech-dispatcher'
          )
        }
      }
    }, 3_000)
  } else {
    doSpeak()
  }

  return true
}

// ── Diagnostic helper — call from browser console to debug ───────────────
export function diagnoseVoices() {
  if (!isSpeechSupported()) {
    console.error('speechSynthesis not supported in this browser.')
    return
  }
  const voices = getAvailableVoices()
  if (voices.length === 0) {
    console.warn(
      '⚠️  No voices available!\n\n' +
      'On Arch Linux, install a TTS engine:\n' +
      '  sudo pacman -S espeak-ng speech-dispatcher\n' +
      '  systemctl --user enable --now speech-dispatcher\n\n' +
      'Then restart the browser.'
    )
  } else {
    console.log(`✅ ${voices.length} voices available:`)
    voices.forEach(v => {
      const tag = v.name.toLowerCase().includes('google') ? '⭐ Google' : v.localService ? 'local' : 'network'
      console.log(`  ${v.lang}  ${v.name}  (${tag})`)
    })
    const best = pickVoice('en-US')
    console.log(`\n→ Best voice for en-US: "${best?.name}" (${best?.localService ? 'local' : 'network'})`)
  }
}
