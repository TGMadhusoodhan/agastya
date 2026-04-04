// src/components/MedAnalysis.jsx
import { useState } from 'react'
import VoiceOutput   from './VoiceOutput.jsx'
import CaregiverAlert from './CaregiverAlert.jsx'
import DispenserBridge from './DispenserBridge.jsx'
import PharmacyVoice from './PharmacyVoice.jsx'
import { AlertIcon, InfoIcon, CheckCircleIcon, HeartIcon, PillIcon, CheckIcon } from './Icons.jsx'

const SEVERITY_STYLE = {
  high:   'bg-red-100 border-red-300 text-red-800',
  medium: 'bg-amber-100 border-amber-300 text-amber-800',
  low:    'bg-yellow-50 border-yellow-200 text-yellow-800',
}

// Languages that get dedicated translated sections
const TRANSLATED_LANGS = ['Tamil', 'Spanish']

// Language-specific display labels
const LANG_META = {
  Tamil:   { flag: '🇮🇳', script: 'ta', nativeName: 'தமிழ்' },
  Spanish: { flag: '🇪🇸', script: 'es', nativeName: 'Español' },
}

export default function MedAnalysis({ result, patient, activeMedications, onAddToSchedule, addToast }) {
  const [showVoice,    setShowVoice]    = useState(false)
  const [showAlert,    setShowAlert]    = useState(false)
  const [showDispenser, setShowDispenser] = useState(false)
  const [showPharmacy, setShowPharmacy] = useState(false)
  const [added,        setAdded]        = useState(false)

  if (!result) return null

  const hasHighInteraction = result.interactions?.some(i => i.severity === 'high')
  const showTranslation    = TRANSLATED_LANGS.includes(patient?.language) &&
                             result.translatedInstructions &&
                             result.translatedInstructions !== result.simplifiedInstructions
  const langMeta = LANG_META[patient?.language] || null

  const handleAddToSchedule = () => {
    onAddToSchedule({
      name:        result.medicationName,
      dosage:      result.dosage,
      frequency:   result.frequency,
      frequencyCode: result.frequencyCode,
      slot:        result.slot || 'morning',
      compartment: result.compartment || 1,
      source:      'scan',
    })
    setAdded(true)
  }

  // Build med object for PharmacyVoice
  const medForPharmacy = {
    name:          result.medicationName,
    dosage:        result.dosage,
    frequency:     result.frequency,
    frequencyCode: result.frequencyCode,
    compartment:   result.compartment || 1,
  }

  return (
    <>
      {/* Pharmacy Voice fullscreen overlay */}
      {showPharmacy && (
        <PharmacyVoice
          med={medForPharmacy}
          language={patient?.language || 'Tamil'}
          onClose={() => setShowPharmacy(false)}
        />
      )}

      <div className="space-y-4">
        {/* ── Main card ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1E3A5F]">{result.medicationName}</h2>
              {result.genericName && result.genericName !== result.medicationName && (
                <p className="text-sm text-[#6B7280]">{result.genericName}</p>
              )}
              {result.category && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full font-medium">
                  {result.category}
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-semibold text-[#1F2937]">{result.dosage}</div>
              <div className="text-sm text-[#6B7280]">{result.frequency}</div>
            </div>
          </div>

          {/* English instructions */}
          <div className="bg-sky-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-1">
              Instructions (English)
            </div>
            <p className="text-[#1F2937] font-medium">{result.simplifiedInstructions}</p>
          </div>

          {/* ── Native language translation block ────────────────── */}
          {showTranslation && langMeta && (
            <div className="rounded-xl border-2 border-purple-100 overflow-hidden">
              {/* Header strip */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 flex items-center gap-2">
                <span className="text-lg">{langMeta.flag}</span>
                <span className="text-white font-semibold text-sm">{langMeta.nativeName} மொழிபெயர்ப்பு</span>
                <span className="ml-auto text-purple-200 text-xs">AI translated</span>
              </div>
              {/* Translated content */}
              <div className="bg-purple-50 p-4">
                <p className="text-[#1F2937] text-base leading-relaxed">{result.translatedInstructions}</p>
              </div>
            </div>
          )}

          {/* Spanish-specific friendly label */}
          {patient?.language === 'Spanish' && showTranslation && (
            <div className="bg-orange-50 rounded-xl border border-orange-100 px-4 py-3 flex items-center gap-2">
              <span>🇪🇸</span>
              <p className="text-orange-800 text-sm font-medium">{result.translatedInstructions}</p>
            </div>
          )}

          {/* Interactions */}
          {result.interactions?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Drug Interactions</div>
              {result.interactions.map((interaction, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${SEVERITY_STYLE[interaction.severity] || SEVERITY_STYLE.low}`}>
                  {interaction.severity === 'high' ? <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" /> : interaction.severity === 'medium' ? <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" /> : <InfoIcon className="w-4 h-4 shrink-0 mt-0.5" />}
                  <div>
                    <span className="font-semibold">{interaction.withMedication}: </span>
                    {interaction.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vitals warning */}
          {result.vitalsWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-800">
              <HeartIcon className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" /><span>{result.vitalsWarning}</span>
            </div>
          )}

          {/* No interactions — safe */}
          {(!result.interactions || result.interactions.length === 0) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-500" /><span>No known interactions with current medications</span>
            </div>
          )}

          {/* Side effects + storage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.sideEffects?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-[#6B7280] mb-2">Common Side Effects</div>
                <ul className="space-y-1">
                  {result.sideEffects.slice(0, 4).map((s, i) => (
                    <li key={i} className="text-sm text-[#1F2937] flex gap-2">
                      <span className="text-gray-400">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.storageInstructions && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-[#6B7280] mb-2">Storage</div>
                <p className="text-sm text-[#1F2937]">{result.storageInstructions}</p>
              </div>
            )}
          </div>

          {/* Compartment */}
          <div className="bg-[#1E3A5F] text-white rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
              {result.compartment}
            </div>
            <div>
              <div className="text-xs text-sky-200">AI Dispenser Assignment</div>
              <div className="font-semibold">
                Compartment {result.compartment} —{' '}
                {result.slot === 'morning' ? 'Morning' : result.slot === 'afternoon' ? 'Afternoon' : result.slot === 'night' ? 'Night' : 'Multiple'}
              </div>
            </div>
          </div>

          {/* ── Action buttons ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {/* Voice read */}
            <button
              onClick={() => setShowVoice(v => !v)}
              className="bg-purple-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              Read Aloud
            </button>

            {/* Pharmacy voice — prominent for Tamil/Spanish */}
            <button
              onClick={() => setShowPharmacy(true)}
              className={`py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                ${TRANSLATED_LANGS.includes(patient?.language)
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Pharmacy
            </button>

            {/* Add to schedule */}
            <button
              onClick={handleAddToSchedule}
              disabled={added}
              className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${
                added
                  ? 'bg-emerald-100 text-emerald-700 cursor-default'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {added ? <span className="flex items-center justify-center gap-1"><CheckIcon className="w-4 h-4" /> Added</span> : '+ Schedule'}
            </button>

            {/* Alert caregiver */}
            <button
              onClick={() => setShowAlert(v => !v)}
              className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${
                hasHighInteraction
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5"><AlertIcon className="w-4 h-4" /> Alert</span>
            </button>

            {/* Dispense */}
            <button
              onClick={() => setShowDispenser(v => !v)}
              className="bg-[#1E3A5F] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#152d4a] transition-all flex items-center justify-center gap-1.5"
            >
              <PillIcon className="w-4 h-4" /> Dispense
            </button>
          </div>

          {/* ── Pharmacy shortcut banner (Tamil / Spanish only) ────── */}
          {TRANSLATED_LANGS.includes(patient?.language) && (
            <button
              onClick={() => setShowPharmacy(true)}
              className="w-full mt-1 rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-3 flex items-center gap-3 hover:bg-green-100 transition-all group"
            >
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-bold text-green-800 text-sm">Pharmacy Voice Mode</div>
                <div className="text-green-600 text-xs">
                  {patient?.language === 'Tamil'
                    ? 'மருந்தகத்தில் காட்டுங்கள் — speaks in Tamil'
                    : 'Muéstrelo en la farmacia — speaks in Spanish'}
                </div>
              </div>
              <div className="ml-auto text-green-400 text-lg">→</div>
            </button>
          )}
        </div>

        {/* ── Sub-panels ─────────────────────────────────────────────── */}
        {showVoice && (
          <VoiceOutput
            text={result.simplifiedInstructions}
            translatedText={result.translatedInstructions}
            language={patient?.language}
          />
        )}

        {showAlert && (
          <CaregiverAlert
            patient={patient}
            medication={{ ...result, name: result.medicationName }}
            addToast={addToast}
          />
        )}

        {showDispenser && (
          <DispenserBridge
            compartment={result.compartment || 1}
            drug={result.medicationName}
            dose={result.dosage}
            addToast={addToast}
          />
        )}
      </div>
    </>
  )
}
