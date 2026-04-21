// src/components/Schedule.jsx
import { useState } from 'react'
import DispenserBridge from './DispenserBridge.jsx'
import PharmacyVoice   from './PharmacyVoice.jsx'
import { SunriseIcon, SunIcon, MoonIcon, PillIcon, PharmacyIcon, CheckIcon, CircleIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

const SLOT_STYLE = {
  morning:   { Icon: SunriseIcon, accent: '#D97706', bg: '#FFFBEB', headerBg: '#FEF3C7', border: '#FDE68A',  dot: '#F59E0B' },
  afternoon: { Icon: SunIcon,     accent: '#EA580C', bg: '#FFF7ED', headerBg: '#FFEDD5', border: '#FED7AA',  dot: '#F97316' },
  night:     { Icon: MoonIcon,    accent: '#0891B2', bg: '#F0F9FF', headerBg: '#E0F2FE', border: '#BAE6FD',  dot: '#38BDF8' },
}

const CARD = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
}

const TODAY_KEY = `agastya_taken_${new Date().toISOString().split('T')[0]}`

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function MedCard({ med, taken, onToggle, onPharmacy, addToast, t }) {
  const [showDispenser, setShowDispenser] = useState(false)
  const days      = med.expiryDate ? daysRemaining(med.expiryDate) : null
  const isExpired = days !== null && days <= 0
  const expiryColor = isExpired ? '#94A3B8' : days <= 2 ? '#DC2626' : days <= 5 ? '#D97706' : '#059669'

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        ...CARD,
        background: taken ? 'rgba(5,150,105,0.03)' : isExpired ? '#FAFAFA' : '#fff',
        border: taken ? '1px solid rgba(5,150,105,0.2)' : isExpired ? '1px solid #F1F5F9' : '1px solid #E2E8F0',
        opacity: isExpired ? 0.6 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div
            className={`font-bold text-sm truncate ${taken ? 'line-through' : ''}`}
            style={{ color: taken ? '#94A3B8' : '#0F172A' }}
          >
            {med.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{med.dosage}</div>
          {med.frequency && (
            <div className="text-xs" style={{ color: '#94A3B8' }}>{med.frequency}</div>
          )}

          {med.autoExpire && days !== null && (
            <div className="mt-1 text-xs font-semibold" style={{ color: expiryColor }}>
              {isExpired ? t.schedule.courseComplete : t.schedule.daysLeft(days)}
            </div>
          )}

          <div className="flex items-center gap-1 mt-1.5">
            <span
              className="w-5 h-5 rounded-lg text-[10px] flex items-center justify-center font-bold shrink-0"
              style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB' }}
            >
              {med.compartment || 1}
            </span>
            <span className="text-[10px]" style={{ color: '#94A3B8' }}>{t.schedule.aiAssigned}</span>
          </div>
        </div>

        <button
          onClick={() => !isExpired && onToggle(med.id || med.name)}
          disabled={isExpired}
          className="shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all"
          style={
            taken
              ? { background: '#059669', borderColor: '#059669', color: '#fff', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }
              : isExpired
              ? { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#CBD5E1' }
              : { background: '#fff', borderColor: '#E2E8F0', color: '#CBD5E1' }
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
            style={{ background: 'rgba(37,99,235,0.07)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.15)' }}
          >
            <PillIcon className="w-3.5 h-3.5" /> {t.schedule.dispense}
          </button>
          <button
            onClick={() => onPharmacy(med)}
            className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1"
            style={{ background: 'rgba(8,145,178,0.07)', color: '#0891B2', border: '1px solid rgba(8,145,178,0.15)' }}
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
  const [taken, setTaken] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TODAY_KEY) || '{}') }
    catch { return {} }
  })
  const [pharmacyMed, setPharmacyMed] = useState(null)
  const patientLanguage = patient?.language || 'Tamil'
  const t = useT()

  const toggleTaken = (key) => {
    setTaken(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(TODAY_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const slots = {
    morning:   activeMedications.filter(m => m.slot === 'morning'   || m.slot === 'multiple'),
    afternoon: activeMedications.filter(m => m.slot === 'afternoon' || m.slot === 'multiple'),
    night:     activeMedications.filter(m => m.slot === 'night'     || m.slot === 'multiple'),
  }

  const total      = activeMedications.length
  const takenCount = Object.values(taken).filter(Boolean).length
  const adherence  = total > 0 ? Math.round((takenCount / total) * 100) : 0
  const allDone    = total > 0 && takenCount === total
  const today      = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const adherenceColor = adherence >= 80 ? '#059669' : adherence >= 50 ? '#D97706' : '#DC2626'

  return (
    <div className="space-y-5">
      {pharmacyMed && (
        <PharmacyVoice med={pharmacyMed} language={patientLanguage} onClose={() => setPharmacyMed(null)} />
      )}

      {/* Header */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 6px 24px rgba(37,99,235,0.22)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-1" style={{ color: '#fff' }}>{t.schedule.title}</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{today}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: '#fff' }}>{adherence}%</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{t.schedule.adherence}</div>
          </div>
        </div>
        <div className="relative z-10 mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${adherence}%`, background: '#fff' }}
          />
        </div>
        <div className="relative z-10 mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {t.schedule.takenOf(takenCount, total)}
        </div>
      </div>

      {/* All done celebration */}
      {allDone && (
        <div
          className="bounce-in rounded-2xl p-6 text-center"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', boxShadow: '0 1px 3px rgba(5,150,105,0.08)' }}
        >
          <div className="text-5xl mb-3">🎉</div>
          <div className="font-black text-xl mb-1" style={{ color: '#059669' }}>All doses taken!</div>
          <div className="text-sm" style={{ color: '#64748B' }}>Great job staying on track today.</div>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)' }}>
            <div className="w-2 h-2 rounded-full pulse-live" style={{ background: '#059669' }} />
            <span className="text-xs font-bold" style={{ color: '#059669' }}>100% Adherence Today</span>
          </div>
        </div>
      )}

      {/* No medications */}
      {total === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#F1F5F9' }}>
            <PillIcon className="w-8 h-8" style={{ color: '#CBD5E1' }} />
          </div>
          <p className="font-bold text-lg" style={{ color: '#0F172A' }}>{t.schedule.noMedsTitle}</p>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>{t.schedule.noMedsDesc}</p>
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
                      <div className="font-bold text-sm" style={{ color: '#0F172A' }}>{slotLabel}</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>{slotTime}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#fff', color: cfg.accent, border: `1px solid ${cfg.border}` }}>
                    {meds.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {meds.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed p-6 text-center text-sm"
                      style={{ borderColor: '#E2E8F0', color: '#94A3B8', background: '#FAFAFA' }}>
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
