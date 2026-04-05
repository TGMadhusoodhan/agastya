// src/components/Schedule.jsx — dark glass
import { useState } from 'react'
import DispenserBridge from './DispenserBridge.jsx'
import PharmacyVoice   from './PharmacyVoice.jsx'
import { SunriseIcon, SunIcon, MoonIcon, PillIcon, PharmacyIcon, CheckIcon, CircleIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

const SLOT_STYLE = {
  morning:   { Icon: SunriseIcon,  accent: '#FFB800', headerBg: 'rgba(255,184,0,0.08)',   border: 'rgba(255,184,0,0.2)'  },
  afternoon: { Icon: SunIcon,      accent: '#FF6B35', headerBg: 'rgba(255,107,53,0.08)',  border: 'rgba(255,107,53,0.2)' },
  night:     { Icon: MoonIcon,     accent: '#00C8FF', headerBg: 'rgba(0,200,255,0.08)',   border: 'rgba(0,200,255,0.2)'  },
}

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function MedCard({ med, taken, onToggle, onPharmacy, addToast, t }) {
  const [showDispenser, setShowDispenser] = useState(false)
  const days      = med.expiryDate ? daysRemaining(med.expiryDate) : null
  const isExpired = days !== null && days <= 0

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: taken
          ? 'rgba(0,232,123,0.05)'
          : isExpired
          ? 'rgba(255,255,255,0.02)'
          : 'rgba(10,22,34,0.75)',
        border: taken
          ? '1px solid rgba(0,232,123,0.18)'
          : isExpired
          ? '1px solid rgba(255,255,255,0.05)'
          : '1px solid rgba(0,232,123,0.1)',
        backdropFilter: 'blur(20px)',
        opacity: isExpired ? 0.5 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div
            className={`font-bold text-sm truncate ${taken ? 'line-through' : ''}`}
            style={{ color: taken ? 'var(--t4)' : 'var(--t1)' }}
          >
            {med.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>{med.dosage}</div>
          {med.frequency && (
            <div className="text-xs" style={{ color: 'var(--t4)' }}>{med.frequency}</div>
          )}

          {med.autoExpire && days !== null && (
            <div
              className="mt-1 text-xs font-semibold"
              style={{
                color: isExpired ? 'var(--t4)' :
                       days <= 2 ? '#FF4D6A' :
                       days <= 5 ? '#FFAD00' : '#00E87B',
              }}
            >
              {isExpired ? t.schedule.courseComplete : t.schedule.daysLeft(days)}
            </div>
          )}

          <div className="flex items-center gap-1 mt-1.5">
            <span
              className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0"
              style={{ background: 'rgba(0,232,123,0.15)', color: '#00E87B' }}
            >
              {med.compartment || 1}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--t4)' }}>{t.schedule.aiAssigned}</span>
          </div>
        </div>

        <button
          onClick={() => !isExpired && onToggle(med.id || med.name)}
          disabled={isExpired}
          className="shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all"
          style={
            taken
              ? { background: '#00E87B', borderColor: '#00E87B', color: '#04100A' }
              : isExpired
              ? { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--t4)' }
              : { background: 'transparent', borderColor: 'rgba(0,232,123,0.2)', color: 'rgba(0,232,123,0.3)' }
          }
        >
          {taken ? <CheckIcon className="w-5 h-5" /> : <CircleIcon className="w-5 h-5" />}
        </button>
      </div>

      {!isExpired && !taken && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowDispenser(v => !v)}
            className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1"
            style={{ background: 'rgba(0,232,123,0.07)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.15)' }}
          >
            <PillIcon className="w-3.5 h-3.5" /> {t.schedule.dispense}
          </button>
          <button
            onClick={() => onPharmacy(med)}
            className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1"
            style={{ background: 'rgba(0,200,255,0.07)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.15)' }}
          >
            <PharmacyIcon className="w-3.5 h-3.5" /> {t.schedule.pharmacy}
          </button>
        </div>
      )}

      {showDispenser && !isExpired && (
        <div className="mt-2">
          <DispenserBridge compartment={med.compartment || 1} drug={med.name} dose={med.dosage} addToast={addToast} />
        </div>
      )}
    </div>
  )
}

export default function Schedule({ activeMedications = [], patient, addToast }) {
  const [taken,       setTaken]       = useState({})
  const [pharmacyMed, setPharmacyMed] = useState(null)
  const patientLanguage = patient?.language || 'Tamil'
  const t = useT()

  const toggleTaken = (key) => setTaken(prev => ({ ...prev, [key]: !prev[key] }))

  const slots = {
    morning:   activeMedications.filter(m => m.slot === 'morning'   || m.slot === 'multiple'),
    afternoon: activeMedications.filter(m => m.slot === 'afternoon' || m.slot === 'multiple'),
    night:     activeMedications.filter(m => m.slot === 'night'     || m.slot === 'multiple'),
  }

  const total      = activeMedications.length
  const takenCount = Object.values(taken).filter(Boolean).length
  const adherence  = total > 0 ? Math.round((takenCount / total) * 100) : 0
  const today      = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-5">
      {pharmacyMed && (
        <PharmacyVoice med={pharmacyMed} language={patientLanguage} onClose={() => setPharmacyMed(null)} />
      )}

      {/* Header */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background: 'rgba(10,22,34,0.85)',
          border: '1px solid rgba(0,232,123,0.15)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,232,123,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,232,123,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--t1)' }}>{t.schedule.title}</h2>
            <p className="text-sm" style={{ color: 'var(--t3)' }}>{today}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: '#00E87B', textShadow: '0 0 16px rgba(0,232,123,0.45)' }}>
              {adherence}%
            </div>
            <div className="text-xs" style={{ color: 'var(--t3)' }}>{t.schedule.adherence}</div>
          </div>
        </div>
        <div className="relative z-10 mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${adherence}%`, background: 'linear-gradient(90deg,#00C864,#00E87B)', boxShadow: '0 0 8px rgba(0,232,123,0.5)' }}
          />
        </div>
        <div className="relative z-10 mt-1 text-xs" style={{ color: 'var(--t4)' }}>
          {t.schedule.takenOf(takenCount, total)}
        </div>
      </div>

      {/* No medications */}
      {total === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(10,22,34,0.6)', border: '1px solid rgba(0,232,123,0.08)' }}>
          <PillIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--t4)' }} />
          <p className="font-bold text-lg" style={{ color: 'var(--t1)' }}>{t.schedule.noMedsTitle}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{t.schedule.noMedsDesc}</p>
        </div>
      )}

      {/* 3-column grid */}
      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(SLOT_STYLE).map(([slot, cfg]) => {
            const meds      = slots[slot]
            const slotLabel = t.schedule[slot]
            const slotTime  = t.schedule[`${slot}Time`]
            return (
              <div key={slot} className="flex flex-col">
                <div
                  className="rounded-2xl px-4 py-3 mb-3 flex items-center justify-between"
                  style={{ background: cfg.headerBg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <cfg.Icon className="w-5 h-5" style={{ color: cfg.accent }} />
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{slotLabel}</div>
                      <div className="text-xs" style={{ color: 'var(--t3)' }}>{slotTime}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${cfg.accent}20`, color: cfg.accent }}>
                    {meds.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {meds.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed p-6 text-center text-sm"
                      style={{ borderColor: 'rgba(0,232,123,0.08)', color: 'var(--t4)' }}>
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
