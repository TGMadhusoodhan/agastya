// src/components/PharmacyVoice.jsx
// Full-screen pharmacy mode — patient shows/speaks this to the pharmacist
import { useState, useEffect, useRef } from 'react'
import { speak, stopSpeaking, isSpeaking, getAvailableVoices } from '../utils/voiceEngine.js'
import { VolumeIcon } from './Icons.jsx'

// ── Static phrase templates (no API needed for core phrase) ──────────────
const TEMPLATES = {
  Tamil: {
    need:      (name, dose) => `எனக்கு ${name} ${dose} வேண்டும்.`,
    frequency: { OD: 'தினமும் ஒரு முறை', BD: 'தினமும் இரு முறை', TDS: 'தினமும் மூன்று முறை', HS: 'இரவு தூங்கும் முன்' },
    help:      'இந்த மருந்தை கண்டுபிடிக்க உதவுங்கள்.',
    label:     'மருந்தகத்திற்கான கோரிக்கை',
    speaking:  'பேசுகிறது...',
    speak:     'பேசு',
    languageCode: 'ta-IN',
  },
  Spanish: {
    need:      (name, dose) => `Necesito ${name} ${dose}.`,
    frequency: { OD: 'una vez al día', BD: 'dos veces al día', TDS: 'tres veces al día', HS: 'antes de dormir' },
    help:      'Por favor, ayúdeme a encontrar este medicamento.',
    label:     'Solicitud de farmacia',
    speaking:  'Hablando...',
    speak:     'Hablar',
    languageCode: 'es-ES',
  },
}

// Fallback for other languages — speak in English
const FALLBACK = {
  need:      (name, dose) => `I need ${name} ${dose}.`,
  frequency: { OD: 'once daily', BD: 'twice daily', TDS: 'three times daily', HS: 'at bedtime' },
  help:      'Please help me find this medication.',
  label:     'Pharmacy request',
  speaking:  'Speaking...',
  speak:     'Speak',
  languageCode: 'en-US',
}

function buildPhrase(med, t) {
  const freqLabel = t.frequency[med.frequencyCode || med.frequency] || med.frequency || ''
  const need      = t.need(med.name, med.dosage || '')
  const freq      = freqLabel ? `${freqLabel}.` : ''
  return [need, freq, t.help].filter(Boolean).join(' ')
}

// ── Waveform animation while speaking ────────────────────────────────────
function Waveform() {
  return (
    <div className="flex items-center justify-center gap-1.5 h-10">
      {[1,2,3,4,5,6,7,8,9].map(i => (
        <div
          key={i}
          className="wave-bar rounded-full bg-white"
          style={{ width: 4, height: `${Math.random() * 28 + 8}px`, animationDelay: `${i * 0.09}s` }}
        />
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
export default function PharmacyVoice({ med, language = 'Tamil', onClose }) {
  const t           = TEMPLATES[language] || FALLBACK
  const phrase      = buildPhrase(med, t)
  const englishPhrase = buildPhrase(med, FALLBACK)

  const [speaking,  setSpeaking]  = useState(false)
  const [autoSpoke, setAutoSpoke] = useState(false)
  const [noVoices,  setNoVoices]  = useState(false)
  const intervalRef = useRef(null)

  // Track speaking state
  useEffect(() => {
    intervalRef.current = setInterval(() => setSpeaking(isSpeaking()), 150)
    return () => {
      clearInterval(intervalRef.current)
      stopSpeaking()
    }
  }, [])

  // Auto-speak once on open (only if voices are available)
  useEffect(() => {
    if (!autoSpoke) {
      setAutoSpoke(true)
      const timer = setTimeout(() => {
        if (getAvailableVoices().length === 0) {
          setNoVoices(true)
          return
        }
        speak(phrase, language)
        setSpeaking(true)
      }, 600)
      // Also check after 3s in case voices load slowly
      const fallback = setTimeout(() => {
        if (getAvailableVoices().length === 0) setNoVoices(true)
      }, 3_000)
      return () => { clearTimeout(timer); clearTimeout(fallback) }
    }
  }, [autoSpoke, phrase, language])

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      speak(phrase, language)
      setSpeaking(true)
    }
  }

  return (
    // Full-screen overlay — dark for high visibility
    <div className="fixed inset-0 z-[200] bg-[#0a1628] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full pulse-live" />
          <span className="text-white/60 text-sm font-semibold uppercase tracking-widest">
            {t.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition"
        >
          ✕
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">

        {/* Medication display — large enough for pharmacist to read */}
        <div className="space-y-4 w-full max-w-lg">
          {/* English */}
          <div className="bg-white/5 rounded-2xl px-6 py-5 border border-white/10">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">English</p>
            <p className="text-white text-2xl font-bold leading-snug">{englishPhrase}</p>
          </div>

          {/* Native language — even larger */}
          <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0EA5E9] rounded-2xl px-6 py-6 border border-sky-400/30 shadow-2xl">
            <p className="text-sky-200 text-xs font-semibold uppercase tracking-widest mb-3">{language}</p>
            <p className="text-white text-3xl font-bold leading-snug">{phrase}</p>
          </div>
        </div>

        {/* Waveform or idle icon */}
        <div className="h-10">
          {speaking ? <Waveform /> : (
            <VolumeIcon className="w-10 h-10 text-white/20" />
          )}
        </div>

        {/* Big SPEAK button */}
        <button
          onClick={handleSpeak}
          className={`w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3 text-white font-bold text-xl shadow-2xl transition-all duration-200 select-none
            ${speaking
              ? 'bg-red-500 hover:bg-red-600 scale-95 shadow-red-500/40'
              : 'bg-gradient-to-br from-[#0EA5E9] to-[#1E3A5F] hover:scale-105 shadow-sky-500/40'
            }`}
          style={{ boxShadow: speaking ? '0 0 60px rgba(239,68,68,0.4)' : '0 0 60px rgba(14,165,233,0.4)' }}
        >
          {speaking ? (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              <span className="text-sm">{t.speaking}</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              <span>{t.speak}</span>
            </>
          )}
        </button>

        {noVoices ? (
          <div className="bg-amber-900/30 border border-amber-500/40 rounded-2xl px-5 py-4 text-center max-w-sm space-y-2">
            <p className="text-amber-300 font-semibold text-sm">No TTS engine installed</p>
            <p className="text-amber-400 text-xs font-mono leading-relaxed">
              sudo pacman -S espeak-ng speech-dispatcher<br/>
              systemctl --user enable --now speech-dispatcher
            </p>
            <p className="text-amber-500 text-xs">Restart browser after installing</p>
          </div>
        ) : (
          <p className="text-white/30 text-sm max-w-xs text-center">
            Show this screen to the pharmacist or press the button to speak
          </p>
        )}
      </div>

      {/* Medication info footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-6 text-white/50 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {med.compartment || 1}
            </div>
            <span>{med.name} · {med.dosage}</span>
          </div>
          {(med.frequencyCode || med.frequency) && (
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-white/70">
              {med.frequencyCode || med.frequency}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
