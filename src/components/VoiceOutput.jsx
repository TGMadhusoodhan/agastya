// src/components/VoiceOutput.jsx
import { useState, useEffect } from 'react'
import { speak, stopSpeaking, isSpeaking, isSpeechSupported, getAvailableVoices } from '../utils/voiceEngine.js'

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Kannada', 'Spanish', 'Mandarin', 'French', 'Arabic']

export default function VoiceOutput({ text, translatedText, language = 'English' }) {
  const [speaking,      setSpeaking]      = useState(false)
  const [selectedLang,  setSelectedLang]  = useState(language)
  const [voicesReady,   setVoicesReady]   = useState(false)
  const [noVoices,      setNoVoices]      = useState(false)

  const supported = isSpeechSupported()

  // Check voice availability once on mount
  useEffect(() => {
    if (!supported) return

    const check = () => {
      const v = getAvailableVoices()
      if (v.length > 0) {
        setVoicesReady(true)
        setNoVoices(false)
      }
    }

    check()
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        check()
        window.speechSynthesis.onvoiceschanged = null
      }
    }
    // After 3 seconds with no voices → show install hint
    const t = setTimeout(() => {
      if (getAvailableVoices().length === 0) setNoVoices(true)
    }, 3_000)

    return () => clearTimeout(t)
  }, [supported])

  // Track speaking state
  useEffect(() => {
    const interval = setInterval(() => setSpeaking(isSpeaking()), 200)
    return () => {
      clearInterval(interval)
      stopSpeaking()
    }
  }, [])

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    const textToRead = selectedLang !== 'English' && translatedText ? translatedText : text
    speak(textToRead, selectedLang)
    setSpeaking(true)
  }

  // ── Not supported at all ─────────────────────────────────────────────
  if (!supported) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-[#6B7280]">
        Voice output requires Chrome or Edge browser.
      </div>
    )
  }

  // ── No TTS engine installed ──────────────────────────────────────────
  if (noVoices) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">🔇</span>
          <div>
            <p className="font-semibold text-amber-800">No text-to-speech engine found</p>
            <p className="text-amber-700 text-sm mt-1">
              On Linux, install <strong>espeak-ng</strong> to enable voice output:
            </p>
          </div>
        </div>
        <div className="bg-amber-900/10 rounded-xl px-4 py-3 font-mono text-xs text-amber-900 space-y-1">
          <div>sudo pacman -S espeak-ng speech-dispatcher</div>
          <div>systemctl --user enable --now speech-dispatcher</div>
        </div>
        <p className="text-amber-600 text-xs">Restart the browser after installing.</p>
      </div>
    )
  }

  // ── Normal voice output ──────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide flex items-center gap-2">
          Voice Output
          {voicesReady && <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />}
        </div>
        <select
          value={selectedLang}
          onChange={e => { setSelectedLang(e.target.value); stopSpeaking(); setSpeaking(false) }}
          className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500"
        >
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSpeak}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
            ${speaking
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
        >
          {speaking ? (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              Read Aloud
            </>
          )}
        </button>

        {/* Waveform animation */}
        {speaking && (
          <div className="flex items-center gap-0.5 h-8">
            {[1,2,3,4,5,6,7].map(i => (
              <div
                key={i}
                className="wave-bar w-1 bg-purple-500 rounded-full"
                style={{ height: `${Math.random() * 24 + 8}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-[#6B7280] bg-gray-50 rounded-xl p-3 leading-relaxed">
        {selectedLang !== 'English' && translatedText ? translatedText : text}
      </p>
    </div>
  )
}
