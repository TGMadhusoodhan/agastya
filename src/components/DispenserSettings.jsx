// src/components/DispenserSettings.jsx — light medical
import { useState, useEffect } from 'react'
import { SunriseIcon, SunIcon, MoonIcon, PillIcon, PauseIcon, PlayIcon, FlaskIcon } from './Icons.jsx'
import {
  removeMedicationFromDispenser,
  toggleAutoExpire,
  extendMedicationExpiry,
  addMedicationToDispenser,
  updateMedicationInDispenser,
} from '../utils/prescriptionDB.js'
import { triggerDispenser, checkDispenserHealth, getDispenserLog } from '../utils/dispenser.js'
import { useT, useLang } from '../contexts/LanguageContext.jsx'
import { translateNames } from '../utils/claudeApi.js'

const inputStyle = {
  background: '#fff',
  border: '1px solid #CBD5E1',
  color: '#0F172A',
  borderRadius: '0.875rem',
  padding: '0.5rem 0.75rem',
  width: '100%',
  fontSize: '0.875rem',
  outline: 'none',
}

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ med }) {
  const t    = useT()
  const tc   = t.common
  const ts   = t.schedule
  const days = med.expiryDate ? daysRemaining(med.expiryDate) : null
  if (!med.autoExpire) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>
        {tc.permanent}
      </span>
    )
  }
  if (days === null) return null
  if (days <= 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium line-through"
        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
        {tc.expired}
      </span>
    )
  }
  if (days <= 2) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
        {ts.daysLeft(days)}
      </span>
    )
  }
  if (days <= 5) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
        {ts.daysLeft(days)}
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: '#F0FDF4', color: '#059669', border: '1px solid #BBF7D0' }}>
      {ts.daysLeft(days)}
    </span>
  )
}

function MedCard({ med, onRemove, onToggleExpire, onExtend, onPause, tx }) {
  const [extending, setExtending] = useState(false)
  const t   = useT()
  const tds = t.dispenserSettings

  return (
    <div
      className="rounded-2xl p-4 space-y-3 transition-all"
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        opacity: med.paused ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
          style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}
        >
          {med.compartment || 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" style={{ color: '#0F172A' }}>{tx(med.name)}</div>
          <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{med.dosage} — {med.frequency}</div>
        </div>
        <span
          className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
          style={
            med.source === 'prescription'
              ? { background: '#F0F9FF', color: '#0891B2', border: '1px solid #BAE6FD' }
              : { background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }
          }
        >
          {med.source || 'manual'}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <ExpiryBadge med={med} />
        {med.paused && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
            {tds.paused}
          </span>
        )}
      </div>

      {/* Auto-expire toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: '#64748B' }}>{tds.autoExpire}</span>
        <button
          onClick={() => onToggleExpire(med.id, !med.autoExpire)}
          className="w-10 h-5 rounded-full transition-all relative shrink-0"
          style={{ background: med.autoExpire ? '#2563EB' : '#E2E8F0' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
            style={{ left: med.autoExpire ? '1.25rem' : '0.125rem' }}
          />
        </button>
      </div>

      {/* Extend */}
      {med.autoExpire && med.expiryDate && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold" style={{ color: '#64748B' }}>{tds.extend}</span>
          {[1, 3, 5].map((d) => (
            <button
              key={d}
              onClick={() => { setExtending(true); onExtend(med.id, d).finally(() => setExtending(false)) }}
              disabled={extending}
              className="text-xs px-2 py-0.5 rounded-lg font-semibold transition-all disabled:opacity-40"
              style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }}
            >
              +{d}d
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onPause(med.id, !med.paused)}
          className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-1"
          style={
            med.paused
              ? { background: '#F0FDF4', color: '#059669', border: '1px solid #BBF7D0' }
              : { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }
          }
        >
          {med.paused ? <><PlayIcon className="w-3 h-3" /> {tds.resume}</> : <><PauseIcon className="w-3 h-3" /> {tds.pause}</>}
        </button>
        <button
          onClick={() => onRemove(med.id)}
          className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
        >
          {tds.remove}
        </button>
      </div>
    </div>
  )
}

const INITIAL_FORM = {
  name: '', dosage: '', frequency: 'OD', slot: 'morning',
  durationDays: '', autoExpire: false,
}

export default function DispenserSettings({ activeMedications, onMedicationsChanged, addToast }) {
  const [dispenserStatus, setDispenserStatus] = useState(null)
  const [dispenserLog, setDispenserLog] = useState([])
  const [addForm, setAddForm] = useState(INITIAL_FORM)
  const [adding, setAdding] = useState(false)
  const [testDispensing, setTestDispensing] = useState(false)
  const [section, setSection] = useState('current')
  const [translated, setTranslated] = useState({})

  const t    = useT()
  const lang = useLang()
  const tds  = t.dispenserSettings
  const tc   = t.common
  const ts   = t.schedule

  useEffect(() => {
    checkDispenserHealth().then(setDispenserStatus)
    getDispenserLog().then(setDispenserLog)
  }, [])

  useEffect(() => {
    if (lang === 'English' || !activeMedications?.length) { setTranslated({}); return }
    const names = activeMedications.map(m => m.name).filter(Boolean)
    translateNames([...new Set(names)], lang).then(setTranslated).catch(() => {})
  }, [activeMedications, lang])

  const tx   = name => (name ? translated[name] || name : name)
  const meds = activeMedications || []

  const slotGroups = {
    morning:   meds.filter((m) => m.slot === 'morning'   || m.slot === 'multiple'),
    afternoon: meds.filter((m) => m.slot === 'afternoon' || m.slot === 'multiple'),
    night:     meds.filter((m) => m.slot === 'night'     || m.slot === 'multiple'),
  }

  const handleRemove = async (id) => {
    try {
      await removeMedicationFromDispenser(id)
      await onMedicationsChanged()
      addToast('Medication removed from dispenser', 'info')
    } catch { addToast('Failed to remove medication', 'error') }
  }

  const handleToggleExpire = async (id, value) => {
    try {
      await toggleAutoExpire(id, value)
      await onMedicationsChanged()
    } catch { addToast('Failed to update setting', 'error') }
  }

  const handleExtend = async (id, days) => {
    try {
      await extendMedicationExpiry(id, days)
      await onMedicationsChanged()
      addToast(`Expiry extended by ${days} days`, 'success')
    } catch { addToast('Failed to extend expiry', 'error') }
  }

  const handlePause = async (id, paused) => {
    try {
      await updateMedicationInDispenser(id, { paused })
      await onMedicationsChanged()
      addToast(paused ? 'Medication paused' : 'Medication resumed', 'info')
    } catch { addToast('Failed to update', 'error') }
  }

  const handleAdd = async () => {
    if (!addForm.name.trim()) { addToast('Please enter a medication name', 'error'); return }
    setAdding(true)
    try {
      const compartmentMap = { morning: 1, afternoon: 2, night: 3, multiple: 1 }
      const durationDays = addForm.durationDays ? parseInt(addForm.durationDays) : null
      const today = new Date()
      const expiryDate = durationDays
        ? new Date(today.setDate(today.getDate() + durationDays)).toISOString().split('T')[0]
        : null
      await addMedicationToDispenser({
        name: addForm.name.trim(), dosage: addForm.dosage,
        frequency: addForm.frequency, slot: addForm.slot,
        compartment: compartmentMap[addForm.slot],
        autoExpire: !!durationDays, expiryDate, durationDays,
        source: 'manual', prescriptionId: null,
      })
      await onMedicationsChanged()
      addToast(`${addForm.name} added to dispenser`, 'success')
      setAddForm(INITIAL_FORM)
    } catch { addToast('Failed to add medication', 'error') }
    finally { setAdding(false) }
  }

  const handleTestDispense = async () => {
    setTestDispensing(true)
    await triggerDispenser(1, 'Test', 'Empty')
    await new Promise((r) => setTimeout(r, 1500))
    setTestDispensing(false)
    addToast('Test dispense complete', 'success')
  }

  const SECTIONS = [
    { id: 'current', label: tds.current },
    { id: 'expiry',  label: tds.expiry  },
    { id: 'add',     label: tds.addManually },
    { id: 'status',  label: tds.status  },
  ]

  const cardStyle = { background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', borderRadius: '1.5rem', padding: '1.5rem' }

  const SLOT_CFG = {
    morning:   { Icon: SunriseIcon,  accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: tc.morning,   time: ts.morningTime   },
    afternoon: { Icon: SunIcon,      accent: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', label: tc.afternoon, time: ts.afternoonTime },
    night:     { Icon: MoonIcon,     accent: '#0891B2', bg: '#F0F9FF', border: '#BAE6FD', label: tc.night,     time: ts.nightTime     },
  }

  const SLOT_OPTIONS = [
    { value: 'morning',   label: tc.morning   },
    { value: 'afternoon', label: tc.afternoon },
    { value: 'night',     label: tc.night     },
    { value: 'multiple',  label: 'Multiple'   },
  ]

  const COMP_CFG = [
    { slot: 'morning',   comp: 1, accent: '#D97706', bg: '#FFFBEB', label: tc.morning   },
    { slot: 'afternoon', comp: 2, accent: '#EA580C', bg: '#FFF7ED', label: tc.afternoon },
    { slot: 'night',     comp: 3, accent: '#0891B2', bg: '#F0F9FF', label: tc.night     },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 6px 24px rgba(37,99,235,0.22)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10">
          <h2 className="text-2xl font-black" style={{ color: '#fff' }}>{tds.title}</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{tds.medsLoaded(meds.length)}</p>
        </div>
      </div>

      {/* Section tabs */}
      <div
        className="flex gap-1.5 p-1.5 rounded-2xl overflow-x-auto"
        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              section === s.id
                ? { background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }
                : { color: '#64748B', border: '1px solid transparent' }
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* SECTION: Current Medications */}
      {section === 'current' && (
        <div className="space-y-5">
          {Object.entries(SLOT_CFG).map(([slot, cfg]) => {
            const slotMeds = slotGroups[slot]
            return (
              <div key={slot}>
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-2xl mb-3"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <cfg.Icon className="w-5 h-5" style={{ color: cfg.accent }} />
                    <div>
                      <div className="font-bold text-sm" style={{ color: '#0F172A' }}>{cfg.label}</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>{cfg.time}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${cfg.accent}20`, color: cfg.accent }}>
                    {slotMeds.length}
                  </span>
                </div>
                {slotMeds.length === 0 ? (
                  <p className="text-sm pl-4" style={{ color: '#94A3B8' }}>{tds.noSlotMeds}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {slotMeds.map((med) => (
                      <MedCard key={med.id} med={med} tx={tx} onRemove={handleRemove} onToggleExpire={handleToggleExpire} onExtend={handleExtend} onPause={handlePause} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {meds.length === 0 && (
            <div className="rounded-3xl p-14 text-center" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
              <PillIcon className="w-12 h-12 mx-auto mb-3" style={{ color: '#CBD5E1' }} />
              <p className="font-bold text-lg" style={{ color: '#0F172A' }}>{tds.noMeds}</p>
              <p className="text-sm mt-1" style={{ color: '#64748B' }}>{tds.noMedsSub}</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION: Auto-Expiry */}
      {section === 'expiry' && (
        <div style={cardStyle} className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>{tds.autoExpSched}</div>
          {meds.filter((m) => m.autoExpire).length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#94A3B8' }}>{tds.noAutoExp}</p>
          ) : (
            meds.filter((m) => m.autoExpire).map((med) => {
              const days = med.expiryDate ? daysRemaining(med.expiryDate) : null
              return (
                <div key={med.id} className="flex items-center gap-3 pb-3 last:pb-0" style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>{tx(med.name)} {med.dosage}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      {tds.expires} {med.expiryDate}
                      {days !== null && ` (${days <= 0 ? tc.expired.toLowerCase() : ts.daysLeft(days)})`}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {[1, 3, 5].map((d) => (
                      <button key={d} onClick={() => handleExtend(med.id, d)}
                        className="text-xs px-2 py-0.5 rounded-lg font-semibold transition-all"
                        style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }}>
                        +{d}d
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* SECTION: Add Manually */}
      {section === 'add' && (
        <div style={cardStyle} className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>{tds.addSection}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748B' }}>{tds.medName}</label>
              <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} style={inputStyle} placeholder="e.g. Paracetamol" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748B' }}>{tds.dosage}</label>
              <input value={addForm.dosage} onChange={(e) => setAddForm({ ...addForm, dosage: e.target.value })} style={inputStyle} placeholder="e.g. 500mg" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748B' }}>{tds.frequency}</label>
              <select value={addForm.frequency} onChange={(e) => setAddForm({ ...addForm, frequency: e.target.value })} style={inputStyle}>
                {['OD', 'BD', 'TDS', 'QID', 'HS', 'SOS'].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748B' }}>{tds.slot}</label>
              <select value={addForm.slot} onChange={(e) => setAddForm({ ...addForm, slot: e.target.value })} style={inputStyle}>
                {SLOT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748B' }}>{tds.duration}</label>
              <input value={addForm.durationDays} onChange={(e) => setAddForm({ ...addForm, durationDays: e.target.value })} type="number" min="1" style={inputStyle} placeholder={tds.durationPlaceholder} />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#1D56DB,#2563EB)', color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.25)' }}
          >
            {adding ? tds.addBtn : tds.addBtnIdle}
          </button>
        </div>
      )}

      {/* SECTION: Dispenser Status */}
      {section === 'status' && (
        <div className="space-y-4">
          <div style={cardStyle} className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>{tds.status}</div>

            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${dispenserStatus?.status === 'online' ? 'pulse-live' : ''}`}
                style={{ background: dispenserStatus?.status === 'online' ? '#059669' : '#DC2626' }}
              />
              <div>
                <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>
                  {dispenserStatus?.status === 'online' ? tds.onlineReady : tds.offline}
                </div>
                <div className="text-xs" style={{ color: '#64748B' }}>
                  {dispenserStatus?.status === 'online'
                    ? `${dispenserStatus.total_dispenses || 0} total dispenses`
                    : tds.offlineSub}
                </div>
              </div>
            </div>

            {dispenserLog.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>{tds.recentDisp}</div>
                <div className="space-y-1.5">
                  {dispenserLog.slice(-5).reverse().map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-xl"
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <span className="font-medium" style={{ color: '#0F172A' }}>{entry.drug} {entry.dose}</span>
                      <span className="text-xs" style={{ color: '#64748B' }}>{entry.tray}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {COMP_CFG.map(({ comp, accent, bg, label, slot }) => (
                <div key={slot} className="rounded-2xl p-3 text-center"
                  style={{ background: bg, border: '1px solid #E2E8F0' }}>
                  <div className="text-xs font-semibold" style={{ color: '#64748B' }}>{label}</div>
                  <div className="font-black text-2xl my-1" style={{ color: accent }}>{comp}</div>
                  <div className="text-xs font-semibold"
                    style={{ color: meds.filter((m) => m.compartment === comp).length > 0 ? '#059669' : '#94A3B8' }}>
                    {meds.filter((m) => m.compartment === comp).length > 0 ? tds.loaded : tds.empty}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleTestDispense}
              disabled={testDispensing}
              className="w-full py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: '#F0F9FF', color: '#0891B2', border: '1px solid #BAE6FD' }}
            >
              {testDispensing
                ? <><div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: '#BAE6FD', borderTopColor: '#0891B2' }} /> {tds.testing}</>
                : <><FlaskIcon className="w-4 h-4" /> {tds.testDispense}</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
