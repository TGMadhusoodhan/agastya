// src/components/VoiceOutput.jsx — light medical
import { useState, useEffect } from 'react'
import { speak, stopSpeaking, isSpeaking, isSpeechSupported, getAvailableVoices } from '../utils/voiceEngine.js'

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Kannada', 'Spanish', 'Mandarin', 'French', 'Arabic']

export default function VoiceOutput({ text, translatedText, language = 'English' }) {
  const [speaking,     setSpeaking]     = useState(false)
  const [selectedLang, setSelectedLang] = useState(language)
  const [voicesReady,  setVoicesReady]  = useState(false)
  const [noVoices,     setNoVoices]     = useState(false)

  const supported = isSpeechSupported()

  useEffect(() => {
    if (!supported) return
    const check = () => { if (getAvailableVoices().length > 0) { setVoicesReady(true); setNoVoices(false) } }
    check()
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => { check(); window.speechSynthesis.onvoiceschanged = null }
    const t = setTimeout(() => { if (getAvailableVoices().length === 0) setNoVoices(true) }, 3000)
    return () => clearTimeout(t)
  }, [supported])

  useEffect(() => {
    const interval = setInterval(() => setSpeaking(isSpeaking()), 200)
    return () => { clearInterval(interval); stopSpeaking() }
  }, [])

  const handleSpeak = () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return }
    speak(selectedLang !== 'English' && translatedText ? translatedText : text, selectedLang)
    setSpeaking(true)
  }

  if (!supported) return (
    <div className="rounded-2xl p-4 text-sm" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
      Voice output requires Chrome or Edge.
    </div>
  )

  if (noVoices) return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🔇</span>
        <div>
          <p className="font-bold text-sm" style={{ color: '#D97706' }}>No TTS engine found</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>Install espeak-ng to enable voice output:</p>
        </div>
      </div>
      <div className="rounded-xl px-4 py-3 font-mono text-xs space-y-1" style={{ background: '#1E293B', color: '#94A3B8' }}>
        <div>sudo pacman -S espeak-ng speech-dispatcher</div>
        <div>systemctl --user enable --now speech-dispatcher</div>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>
          Voice Output
          {voicesReady && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#059669' }} />}
        </div>
        <select
          value={selectedLang}
          onChange={e => { setSelectedLang(e.target.value); stopSpeaking(); setSpeaking(false) }}
          className="text-xs rounded-xl px-2 py-1"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
        >
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSpeak}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all"
          style={
            speaking
              ? { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }
              : { background: 'rgba(159,110,255,0.1)', color: '#9F6EFF', border: '1px solid rgba(159,110,255,0.25)' }
          }
        >
          {speaking ? (
            <><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> Stop</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Read Aloud</>
          )}
        </button>
        {speaking && (
          <div className="flex items-center gap-0.5 h-8">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="wave-bar w-1 rounded-full" style={{ height: `${Math.random()*24+8}px`, background: '#9F6EFF', animationDelay: `${i*0.1}s` }} />
            ))}
          </div>
        )}
      </div>

      <p className="text-sm leading-relaxed p-3 rounded-2xl" style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0' }}>
        {selectedLang !== 'English' && translatedText ? translatedText : text}
      </p>
    </div>
  )
}
