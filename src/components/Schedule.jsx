// src/components/Schedule.jsx — 3-column morning/afternoon/night layout
import { useState } from 'react'
import DispenserBridge from './DispenserBridge.jsx'
import PharmacyVoice   from './PharmacyVoice.jsx'
import { SunriseIcon, SunIcon, MoonIcon, PillIcon, PharmacyIcon, CheckIcon, CircleIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

const SLOT_STYLE = {
  morning:   { Icon: SunriseIcon, bg: 'from-amber-50 to-yellow-50',   border: 'border-amber-200',  header: 'bg-amber-500'   },
  afternoon: { Icon: SunIcon,     bg: 'from-orange-50 to-red-50',     border: 'border-orange-200', header: 'bg-orange-500'  },
  night:     { Icon: MoonIcon,    bg: 'from-blue-50 to-indigo-50',    border: 'border-blue-200',   header: 'bg-blue-600'    },
}

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function MedCard({ med, taken, onToggle, onPharmacy, addToast, t }) {
  const [showDispenser, setShowDispenser] = useState(false)
  const days = med.expiryDate ? daysRemaining(med.expiryDate) : null
  const isExpired = days !== null && days <= 0

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      taken
        ? 'bg-emerald-50 border-emerald-200 opacity-80'
        : isExpired
        ? 'bg-gray-50 border-gray-200 opacity-60'
        : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm truncate ${taken ? 'line-through text-gray-400' : 'text-[#1E3A5F]'}`}>
            {med.name}
          </div>
          <div className="text-xs text-[#6B7280] mt-0.5">{med.dosage}</div>
          {med.frequency && (
            <div className="text-xs text-[#9CA3AF]">{med.frequency}</div>
          )}
          {/* Expiry badge */}
          {med.autoExpire && days !== null && (
            <div className={`mt-1 text-xs font-medium ${
              isExpired     ? 'text-gray-400 line-through' :
              days <= 2     ? 'text-red-500' :
              days <= 5     ? 'text-amber-500' :
                              'text-emerald-600'
            }`}>
              {isExpired ? t.schedule.courseComplete : t.schedule.daysLeft(days)}
            </div>
          )}
          {/* Compartment */}
          <div className="flex items-center gap-1 mt-1.5">
            <span className="w-5 h-5 bg-[#1E3A5F] text-white rounded-full text-[10px] flex items-center justify-center font-bold shrink-0">
              {med.compartment || 1}
            </span>
            <span className="text-[10px] text-gray-400">{t.schedule.aiAssigned}</span>
          </div>
        </div>

        {/* Taken toggle */}
        <button
          onClick={() => !isExpired && onToggle(med.id || med.name)}
          disabled={isExpired}
          className={`shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all font-bold text-lg
            ${taken
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : isExpired
              ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-default'
              : 'bg-white border-gray-300 text-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
            }`}
        >
          {taken ? <CheckIcon className="w-5 h-5" /> : <CircleIcon className="w-5 h-5" />}
        </button>
      </div>

      {/* Action buttons */}
      {!isExpired && !taken && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowDispenser(v => !v)}
            className="flex-1 text-xs py-1.5 rounded-lg bg-[#1E3A5F]/5 text-[#1E3A5F] font-semibold hover:bg-[#1E3A5F]/10 transition-all border border-[#1E3A5F]/10 flex items-center justify-center gap-1"
          >
            <PillIcon className="w-3.5 h-3.5" /> {t.schedule.dispense}
          </button>
          <button
            onClick={() => onPharmacy(med)}
            className="flex-1 text-xs py-1.5 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-all border border-green-200 flex items-center justify-center gap-1"
            title="Pharmacy voice mode"
          >
            <PharmacyIcon className="w-3.5 h-3.5" /> {t.schedule.pharmacy}
          </button>
        </div>
      )}

      {showDispenser && !isExpired && (
        <div className="mt-2">
          <DispenserBridge
            compartment={med.compartment || 1}
            drug={med.name}
            dose={med.dosage}
            addToast={addToast}
          />
        </div>
      )}
    </div>
  )
}

export default function Schedule({ activeMedications = [], patient, addToast }) {
  const [taken,          setTaken]          = useState({})
  const [pharmacyMed,    setPharmacyMed]    = useState(null)
  const patientLanguage = patient?.language || 'Tamil'
  const t = useT()

  const toggleTaken = (key) => {
    setTaken(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Group medications by slot
  const slots = {
    morning:   activeMedications.filter(m => m.slot === 'morning'   || m.slot === 'multiple'),
    afternoon: activeMedications.filter(m => m.slot === 'afternoon' || m.slot === 'multiple'),
    night:     activeMedications.filter(m => m.slot === 'night'     || m.slot === 'multiple'),
  }

  const total     = activeMedications.length
  const takenCount = Object.values(taken).filter(Boolean).length
  const adherence = total > 0 ? Math.round((takenCount / total) * 100) : 0

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="space-y-5">
      {pharmacyMed && (
        <PharmacyVoice
          med={pharmacyMed}
          language={patientLanguage}
          onClose={() => setPharmacyMed(null)}
        />
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0EA5E9] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{t.schedule.title}</h2>
            <p className="text-white/70 text-sm">{today}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{adherence}%</div>
            <div className="text-white/60 text-xs">{t.schedule.adherence}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${adherence}%` }}
          />
        </div>
        <div className="mt-1 text-white/60 text-xs">{t.schedule.takenOf(takenCount, total)}</div>
      </div>

      {/* No medications state */}
      {total === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="flex justify-center mb-3"><PillIcon className="w-12 h-12 text-gray-300" /></div>
          <p className="font-bold text-[#1E3A5F] text-lg">{t.schedule.noMedsTitle}</p>
          <p className="text-[#9CA3AF] text-sm mt-1">{t.schedule.noMedsDesc}</p>
        </div>
      )}

      {/* 3-column layout */}
      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(SLOT_STYLE).map(([slot, cfg]) => {
            const meds = slots[slot]
            const slotLabel = t.schedule[slot]
            const slotTime  = t.schedule[`${slot}Time`]
            return (
              <div key={slot} className="flex flex-col">
                {/* Slot header */}
                <div className={`${cfg.header} text-white rounded-2xl px-4 py-3 mb-3 flex items-center justify-between shadow-sm`}>
                  <div className="flex items-center gap-2">
                    <cfg.Icon className="w-5 h-5 text-white" />
                    <div>
                      <div className="font-bold text-sm">{slotLabel}</div>
                      <div className="text-white/70 text-xs">{slotTime}</div>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {meds.length}
                  </span>
                </div>

                {/* Medication cards */}
                <div className="flex flex-col gap-3">
                  {meds.length === 0 ? (
                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-100 p-6 text-center text-gray-300 text-sm">
                      No medications
                    </div>
                  ) : (
                    meds.map((med, i) => (
                      <MedCard
                        key={med.id || `${med.name}-${i}`}
                        med={med}
                        taken={!!taken[med.id || med.name]}
                        onToggle={toggleTaken}
                        onPharmacy={setPharmacyMed}
                        addToast={addToast}
                        t={t}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
