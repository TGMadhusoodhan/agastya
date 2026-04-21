// src/components/MedAnalysis.jsx — dark glass
import { useState } from 'react'
import VoiceOutput    from './VoiceOutput.jsx'
import CaregiverAlert from './CaregiverAlert.jsx'
import DispenserBridge from './DispenserBridge.jsx'
import PharmacyVoice  from './PharmacyVoice.jsx'
import { AlertIcon, InfoIcon, CheckCircleIcon, HeartIcon, PillIcon, CheckIcon } from './Icons.jsx'

const SEVERITY_STYLE = {
  high:   { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
  medium: { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706' },
  low:    { bg: '#FFFBEB', border: '#FEF3C7', color: '#D97706' },
}

const TRANSLATED_LANGS = ['Tamil', 'Spanish']
const LANG_META = {
  Tamil:   { flag: '🇮🇳', nativeName: 'தமிழ்' },
  Spanish: { flag: '🇪🇸', nativeName: 'Español' },
}

export default function MedAnalysis({ result, patient, activeMedications, onAddToSchedule, addToast }) {
  const [showVoice,     setShowVoice]     = useState(false)
  const [showAlert,     setShowAlert]     = useState(false)
  const [showDispenser, setShowDispenser] = useState(false)
  const [showPharmacy,  setShowPharmacy]  = useState(false)
  const [added,         setAdded]         = useState(false)

  if (!result) return null

  const hasHighInteraction = result.interactions?.some(i => i.severity === 'high')
  const showTranslation    = TRANSLATED_LANGS.includes(patient?.language) &&
                             result.translatedInstructions &&
                             result.translatedInstructions !== result.simplifiedInstructions
  const langMeta = LANG_META[patient?.language] || null

  const handleAddToSchedule = () => {
    onAddToSchedule({
      name: result.medicationName, dosage: result.dosage,
      frequency: result.frequency, frequencyCode: result.frequencyCode,
      slot: result.slot || 'morning', compartment: result.compartment || 1, source: 'scan',
    })
    setAdded(true)
  }

  const medForPharmacy = {
    name: result.medicationName, dosage: result.dosage,
    frequency: result.frequency, frequencyCode: result.frequencyCode,
    compartment: result.compartment || 1,
  }

  const cardStyle = { background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)', borderRadius: '1rem' }

  return (
    <>
      {showPharmacy && (
        <PharmacyVoice med={medForPharmacy} language={patient?.language || 'Tamil'} onClose={() => setShowPharmacy(false)} />
      )}

      <div className="space-y-4">
        {/* Main card */}
        <div className="rounded-2xl p-6 space-y-4" style={cardStyle}>

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black" style={{ color: 'var(--t1)' }}>{result.medicationName}</h2>
              {result.genericName && result.genericName !== result.medicationName && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--t3)' }}>{result.genericName}</p>
              )}
              {result.category && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(0,200,255,0.1)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.2)' }}>
                  {result.category}
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-bold" style={{ color: 'var(--t1)' }}>{result.dosage}</div>
              <div className="text-sm" style={{ color: 'var(--t3)' }}>{result.frequency}</div>
            </div>
          </div>

          {/* English instructions */}
          <div className="rounded-2xl p-4" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#0891B2' }}>
              Instructions (English)
            </div>
            <p className="font-medium" style={{ color: 'var(--t1)' }}>{result.simplifiedInstructions}</p>
          </div>

          {/* Native translation */}
          {showTranslation && langMeta && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(159,110,255,0.25)' }}>
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'rgba(159,110,255,0.12)' }}>
                <span className="text-lg">{langMeta.flag}</span>
                <span className="font-semibold text-sm" style={{ color: '#9F6EFF' }}>{langMeta.nativeName} Translation</span>
                <span className="ml-auto text-xs" style={{ color: 'rgba(159,110,255,0.6)' }}>AI translated</span>
              </div>
              <div className="p-4" style={{ background: 'rgba(159,110,255,0.04)' }}>
                <p className="text-base leading-relaxed" style={{ color: 'var(--t1)' }}>{result.translatedInstructions}</p>
              </div>
            </div>
          )}

          {/* Interactions */}
          {result.interactions?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--t3)' }}>
                Drug Interactions
              </div>
              {result.interactions.map((interaction, i) => {
                const s = SEVERITY_STYLE[interaction.severity] || SEVERITY_STYLE.low
                return (
                  <div key={i} className="flex items-start gap-3 rounded-2xl p-3 text-sm"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    {interaction.severity === 'high'
                      ? <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: s.color }} />
                      : <InfoIcon  className="w-4 h-4 shrink-0 mt-0.5" style={{ color: s.color }} />
                    }
                    <div style={{ color: s.color }}>
                      <span className="font-semibold">{interaction.withMedication}: </span>
                      <span style={{ color: 'var(--t2)' }}>{interaction.description}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Vitals warning */}
          {result.vitalsWarning && (
            <div className="rounded-2xl p-3 flex items-start gap-2 text-sm"
              style={{ background: 'rgba(255,173,0,0.07)', border: '1px solid rgba(255,173,0,0.2)' }}>
              <HeartIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#FFAD00' }} />
              <span style={{ color: '#FFAD00' }}>{result.vitalsWarning}</span>
            </div>
          )}

          {/* Safe */}
          {(!result.interactions || result.interactions.length === 0) && (
            <div className="rounded-2xl p-3 flex items-center gap-2 text-sm"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <CheckCircleIcon className="w-4 h-4 shrink-0" style={{ color: '#059669' }} />
              <span style={{ color: '#059669' }}>No known interactions with current medications</span>
            </div>
          )}

          {/* Side effects + storage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.sideEffects?.length > 0 && (
              <div className="rounded-2xl p-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#64748B' }}>
                  Common Side Effects
                </div>
                <ul className="space-y-1">
                  {result.sideEffects.slice(0, 4).map((s, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--t2)' }}>
                      <span style={{ color: 'var(--t4)' }}>•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.storageInstructions && (
              <div className="rounded-2xl p-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#64748B' }}>
                  Storage
                </div>
                <p className="text-sm" style={{ color: 'var(--t2)' }}>{result.storageInstructions}</p>
              </div>
            )}
          </div>

          {/* Compartment assignment */}
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0"
              style={{ background: 'rgba(37,99,235,0.12)', color: '#2563EB' }}>
              {result.compartment}
            </div>
            <div>
              <div className="text-xs" style={{ color: '#64748B' }}>AI Dispenser Assignment</div>
              <div className="font-bold" style={{ color: '#2563EB' }}>
                Compartment {result.compartment} —{' '}
                {result.slot === 'morning' ? 'Morning' : result.slot === 'afternoon' ? 'Afternoon' : result.slot === 'night' ? 'Night' : 'Multiple'}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => setShowVoice(v => !v)}
              className="py-2.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              style={{ background: 'rgba(159,110,255,0.1)', color: '#9F6EFF', border: '1px solid rgba(159,110,255,0.25)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              Read Aloud
            </button>

            <button
              onClick={() => setShowPharmacy(true)}
              className="py-2.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              style={
                TRANSLATED_LANGS.includes(patient?.language)
                  ? { background: 'linear-gradient(135deg,rgba(0,232,123,0.12),rgba(0,200,255,0.12))', color: '#00E87B', border: '1px solid rgba(0,232,123,0.25)' }
                  : { background: 'rgba(0,232,123,0.07)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.15)' }
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Pharmacy
            </button>

            <button
              onClick={handleAddToSchedule}
              disabled={added}
              className="py-2.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              style={
                added
                  ? { background: 'rgba(0,232,123,0.06)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.15)' }
                  : { background: 'linear-gradient(135deg,#1D56DB,#2563EB)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.2)' }
              }
            >
              {added ? <><CheckIcon className="w-4 h-4" /> Added</> : '+ Schedule'}
            </button>

            <button
              onClick={() => setShowAlert(v => !v)}
              className={`py-2.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${hasHighInteraction ? 'animate-pulse' : ''}`}
              style={
                hasHighInteraction
                  ? { background: 'rgba(255,77,106,0.15)', color: '#FF4D6A', border: '1px solid rgba(255,77,106,0.35)' }
                  : { background: 'rgba(255,173,0,0.1)', color: '#FFAD00', border: '1px solid rgba(255,173,0,0.25)' }
              }
            >
              <AlertIcon className="w-4 h-4" /> Alert
            </button>

            <button
              onClick={() => setShowDispenser(v => !v)}
              className="py-2.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(0,200,255,0.1)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.2)' }}
            >
              <PillIcon className="w-4 h-4" /> Dispense
            </button>
          </div>

          {/* Pharmacy banner */}
          {TRANSLATED_LANGS.includes(patient?.language) && (
            <button
              onClick={() => setShowPharmacy(true)}
              className="w-full mt-1 rounded-2xl p-3 flex items-center gap-3 transition-all"
              style={{ background: 'rgba(0,232,123,0.05)', border: '2px dashed rgba(0,232,123,0.18)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,232,123,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,232,123,0.05)' }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,232,123,0.12)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#00E87B" strokeWidth="2" className="w-5 h-5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-bold text-sm" style={{ color: '#00E87B' }}>Pharmacy Voice Mode</div>
                <div className="text-xs" style={{ color: 'var(--t3)' }}>
                  {patient?.language === 'Tamil'
                    ? 'மருந்தகத்தில் காட்டுங்கள் — speaks in Tamil'
                    : 'Muéstrelo en la farmacia — speaks in Spanish'}
                </div>
              </div>
              <div className="ml-auto font-bold" style={{ color: 'rgba(0,232,123,0.4)' }}>→</div>
            </button>
          )}
        </div>

        {/* Sub-panels */}
        {showVoice && (
          <VoiceOutput text={result.simplifiedInstructions} translatedText={result.translatedInstructions} language={patient?.language} />
        )}
        {showAlert && (
          <CaregiverAlert patient={patient} medication={{ ...result, name: result.medicationName }} addToast={addToast} />
        )}
        {showDispenser && (
          <DispenserBridge compartment={result.compartment || 1} drug={result.medicationName} dose={result.dosage} addToast={addToast} />
        )}
      </div>
    </>
  )
}
