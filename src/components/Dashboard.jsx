// src/components/Dashboard.jsx
import { useMemo, useState, useEffect } from 'react'
import { getVitals, getVitalsStatus } from '../utils/healthData.js'
import { adherenceHistory } from '../data/mockHistory.js'
import { useT, useLang } from '../contexts/LanguageContext.jsx'
import { translateNames } from '../utils/claudeApi.js'
import {
  HeartIcon, PillIcon, CheckCircleIcon, CalendarIcon,
  DropletIcon, BrainIcon, MoonIcon, CameraIcon,
  BarChartIcon, UserIcon, SettingsIcon, ClipboardIcon,
  AlertIcon, ShieldIcon, ChevronRightIcon, ClockIcon,
} from './Icons.jsx'

const CARD = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
}

// ── Metric card ───────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, Icon, color, sub }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ ...CARD, boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
      />
      <div className="flex items-center justify-between mt-1">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}12` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: color, opacity: 0.6 }} />
      </div>
      <div>
        <div className="text-3xl font-black leading-none tracking-tight" style={{ color }}>
          {value}
          <span className="text-sm font-medium ml-1" style={{ color: '#94A3B8' }}>{unit}</span>
        </div>
        <div className="text-xs font-semibold mt-1.5 uppercase tracking-wide" style={{ color: '#64748B' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Next dose banner ──────────────────────────────────────────────────────
function NextDose({ meds, onTabChange }) {
  const hour = new Date().getHours()
  const currentSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night'
  const nextSlot    = currentSlot === 'morning' ? 'afternoon' : currentSlot === 'afternoon' ? 'night' : 'morning'

  const currentMeds = meds.filter(m => m.slot === currentSlot || m.slot === 'multiple')
  const nextMeds    = meds.filter(m => m.slot === nextSlot)
  const displayMeds = currentMeds.length > 0 ? currentMeds : nextMeds
  const displaySlot = currentMeds.length > 0 ? currentSlot : nextSlot
  const isDueSoon   = currentMeds.length > 0

  if (displayMeds.length === 0 || meds.length === 0) return null

  const CFG = {
    morning:   { color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FDE68A', label: 'Morning',   time: '6 AM – 12 PM'  },
    afternoon: { color: '#EA580C', bgColor: '#FFF7ED', borderColor: '#FED7AA', label: 'Afternoon', time: '12 PM – 6 PM' },
    night:     { color: '#0891B2', bgColor: '#F0F9FF', borderColor: '#BAE6FD', label: 'Evening',   time: '6 PM onwards'  },
  }
  const cfg = CFG[displaySlot]

  return (
    <div
      className="rounded-2xl p-4 scale-in"
      style={{ background: cfg.bgColor, border: `1px solid ${cfg.borderColor}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            {isDueSoon && <div className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: cfg.color }} />}
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
              {isDueSoon ? 'Due Now' : 'Coming Up'}
            </span>
          </div>
          <div className="font-semibold text-sm mt-0.5" style={{ color: '#0F172A' }}>
            {cfg.label} Medications
            <span className="font-normal ml-1.5" style={{ color: '#64748B' }}>· {cfg.time}</span>
          </div>
        </div>
        <button
          onClick={() => onTabChange('schedule')}
          className="text-xs px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all"
          style={{ background: cfg.color, color: '#fff', boxShadow: `0 2px 8px ${cfg.color}40` }}
        >
          View →
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {displayMeds.slice(0, 5).map((med, i) => (
          <div
            key={i}
            className="shrink-0 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: '#fff', border: `1px solid ${cfg.borderColor}`, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
              style={{ background: `${cfg.color}18`, color: cfg.color }}
            >
              {med.compartment || i + 1}
            </div>
            <div>
              <div className="text-xs font-semibold whitespace-nowrap" style={{ color: '#0F172A' }}>{med.name}</div>
              <div className="text-[10px] whitespace-nowrap" style={{ color: '#64748B' }}>{med.dosage}</div>
            </div>
          </div>
        ))}
        {displayMeds.length > 5 && (
          <div
            className="shrink-0 rounded-xl px-4 flex items-center justify-center"
            style={{ background: '#fff', border: `1px solid ${cfg.borderColor}` }}
          >
            <span className="text-xs font-bold" style={{ color: cfg.color }}>+{displayMeds.length - 5}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Medication row ────────────────────────────────────────────────────────
function MedRow({ med, tx }) {
  const t = useT()
  const ts = t.schedule
  const slotColor = med.slot === 'morning' ? '#D97706' : med.slot === 'afternoon' ? '#EA580C' : '#0891B2'
  const slotLabel = ts[med.slot] || med.slot
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
        style={{ background: `${slotColor}12`, color: slotColor }}
      >
        {med.compartment || 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: '#0F172A' }}>{tx ? tx(med.name) : med.name}</div>
        <div className="text-xs" style={{ color: '#64748B' }}>{med.dosage}</div>
      </div>
      <span
        className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0"
        style={{ background: `${slotColor}10`, color: slotColor, border: `1px solid ${slotColor}25` }}
      >
        {slotLabel}
      </span>
    </div>
  )
}

// ── Vitals bar row ────────────────────────────────────────────────────────
function VBar({ Icon, label, value, unit, pct, color, status }) {
  const c = status === 'normal' ? color : '#DC2626'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: c }} />
          <span className="text-xs font-medium" style={{ color: '#64748B' }}>{label}</span>
        </div>
        <span className="text-xs font-bold" style={{ color: c }}>
          {value} <span className="font-normal" style={{ color: '#94A3B8' }}>{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: c, transition: 'width 1s ease' }}
        />
      </div>
    </div>
  )
}

// ── Action item row ───────────────────────────────────────────────────────
function ActionItem({ Icon, color, title, subtitle, tab, onTabChange, urgent = false, badge = null }) {
  return (
    <button
      onClick={() => onTabChange(tab)}
      className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all hover:-translate-y-0.5"
      style={{
        background: urgent ? `${color}08` : '#F8FAFC',
        border: `1px solid ${urgent ? `${color}25` : '#F1F5F9'}`,
        boxShadow: urgent ? `0 2px 12px ${color}10` : 'none',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}12` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>{title}</div>
        <div className="text-xs mt-0.5 truncate" style={{ color: '#64748B' }}>{subtitle}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center"
            style={{ background: color, color: '#fff' }}>
            {badge}
          </span>
        )}
        <ChevronRightIcon className="w-4 h-4" style={{ color: '#CBD5E1' }} />
      </div>
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════════
export default function Dashboard({ patient, activeMedications, onTabChange, reconcileResult }) {
  const t    = useT()
  const td   = t.dashboard
  const lang = useLang()
  const [translated, setTranslated] = useState({})

  useEffect(() => {
    if (lang === 'English' || !patient) { setTranslated({}); return }
    const names = [
      patient.name,
      ...(patient.conditions || []),
      ...(activeMedications || []).map(m => m.name),
    ].filter(Boolean)
    translateNames([...new Set(names)], lang).then(setTranslated).catch(() => {})
  }, [patient?.name, lang, activeMedications?.length])

  const tx = name => (name ? translated[name] || name : name)

  const vitals = useMemo(() => getVitals(), [])

  const adh = useMemo(() => {
    const total  = adherenceHistory.length
    const taken  = adherenceHistory.filter(h => h.status === 'taken').length
    const late   = adherenceHistory.filter(h => h.status === 'late').length
    const missed = adherenceHistory.filter(h => h.status === 'missed').length
    const rate   = total > 0 ? Math.round(((taken + late) / total) * 100) : 0
    return { rate, total, taken, late, missed }
  }, [])

  const hrS   = getVitalsStatus(vitals.heartRate)
  const spo2S = getVitalsStatus(vitals.spO2)
  const strS  = getVitalsStatus(vitals.stress)
  const slpS  = getVitalsStatus(vitals.sleep)

  const okCount    = [hrS, spo2S, strS, slpS].filter(s => s === 'normal').length
  const healthScore = Math.min(100, Math.round((adh.rate * 0.55) + (okCount / 4) * 45))
  const scoreColor  = healthScore >= 80 ? '#059669' : healthScore >= 60 ? '#D97706' : '#DC2626'

  const circ    = 2 * Math.PI * 48
  const dashOff = circ - (healthScore / 100) * circ

  const hour    = new Date().getHours()
  const greet   = hour < 12 ? td.goodMorning : hour < 17 ? td.goodAfternoon : td.goodEvening
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // ── Derive action items from real state ──────────────────────────────
  const actionItems = useMemo(() => {
    const items = []
    const hour = new Date().getHours()
    const currentSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'night'
    const slotLabel = currentSlot.charAt(0).toUpperCase() + currentSlot.slice(1)

    const dueMeds = activeMedications.filter(m => m.slot === currentSlot || m.slot === 'multiple')
    if (dueMeds.length > 0) {
      items.push({
        Icon: PillIcon, color: '#D97706', tab: 'schedule', urgent: true, badge: dueMeds.length,
        title: `${dueMeds.length} medication${dueMeds.length !== 1 ? 's' : ''} due — ${slotLabel}`,
        subtitle: dueMeds.slice(0, 3).map(m => m.name).join(', ') + (dueMeds.length > 3 ? '…' : ''),
      })
    }

    const conflictCount = reconcileResult?.totalConflicts || reconcileResult?.conflicts?.length || 0
    if (conflictCount > 0) {
      const criticalCount = reconcileResult?.conflicts?.filter(c => c.severity === 'high').length || 0
      items.push({
        Icon: AlertIcon, color: '#DC2626', tab: 'reconcile', urgent: true, badge: conflictCount,
        title: `${conflictCount} cross-doctor conflict${conflictCount !== 1 ? 's' : ''} detected`,
        subtitle: criticalCount > 0 ? `${criticalCount} critical — tap to review and show your doctor` : 'Tap to review and show your doctor',
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiringSoon = activeMedications.filter(m => {
      if (!m.expiryDate || !m.autoExpire) return false
      const daysLeft = Math.ceil((new Date(m.expiryDate) - today) / (1000 * 60 * 60 * 24))
      return daysLeft >= 0 && daysLeft <= 7
    })
    if (expiringSoon.length > 0) {
      const first = expiringSoon[0]
      const daysLeft = Math.ceil((new Date(first.expiryDate) - today) / (1000 * 60 * 60 * 24))
      items.push({
        Icon: ClockIcon, color: '#7C3AED', tab: 'prescriptions', urgent: false,
        title: `${first.name} course ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
        subtitle: expiringSoon.length > 1 ? `+${expiringSoon.length - 1} other medication${expiringSoon.length > 2 ? 's' : ''} also expiring soon` : 'Renew prescription if treatment continues',
      })
    }

    if (adh.rate < 70 && adh.total > 0) {
      items.push({
        Icon: BarChartIcon, color: '#EA580C', tab: 'history', urgent: false,
        title: `Adherence at ${adh.rate}% — below target`,
        subtitle: `${adh.missed} dose${adh.missed !== 1 ? 's' : ''} missed in the last 30 days`,
      })
    }

    if (activeMedications.length === 0) {
      items.push({
        Icon: CameraIcon, color: '#2563EB', tab: 'scan', urgent: false,
        title: 'No medications in your schedule',
        subtitle: 'Scan a pill bottle or prescription to get started',
      })
    } else if (items.length === 0) {
      items.push({
        Icon: CheckCircleIcon, color: '#059669', tab: 'schedule', urgent: false,
        title: 'All clear — you\'re on track today',
        subtitle: `${activeMedications.length} medication${activeMedications.length !== 1 ? 's' : ''} active · no conflicts detected`,
      })
    }

    return items
  }, [activeMedications, reconcileResult, adh])

  return (
    <div className="space-y-5">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-7"
        style={{
          background: 'linear-gradient(135deg, #1D56DB 0%, #2563EB 45%, #1D4ED8 100%)',
          boxShadow: '0 8px 32px rgba(37,99,235,0.28)',
        }}
      >
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="blob-blue w-64 h-64 -top-16 -right-8 opacity-60" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
        <div className="blob-cyan  w-40 h-40 -bottom-10 left-10"  style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex items-start justify-between gap-4">
          {/* Left: greeting */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full pulse-live" style={{ background: '#6EE7B7' }} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {td.healthAnalytics}
              </span>
            </div>

            <p className="text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>{greet},</p>
            <h1 className="text-[2.4rem] font-black leading-none mt-0.5 truncate" style={{ color: '#fff' }}>
              {tx(patient.name).split(' ')[0]}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>{dateStr}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {patient.age} {td.yrs}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {patient.language}
              </span>
              {patient.conditions.slice(0, 2).map((c, i) => (
                <span key={i} className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  {tx(c)}
                </span>
              ))}
            </div>
          </div>

          {/* Right: score ring */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 110 110" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
                <circle
                  cx="55" cy="55" r="48"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="10"
                  strokeDasharray={circ}
                  strokeDashoffset={dashOff}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))', transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black" style={{ color: '#fff' }}>{healthScore}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>{td.score}</span>
              </div>
            </div>
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>{td.healthIndex}</span>
          </div>
        </div>
      </div>

      {/* ── Next dose ────────────────────────────────────────────────────── */}
      <NextDose meds={activeMedications} onTabChange={onTabChange} />

      {/* ── Metric cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label={td.activeMeds}
          value={activeMedications.length}
          unit=""
          Icon={PillIcon}
          color="#2563EB"
          sub={td.inDispenser}
        />
        <MetricCard
          label={td.adherenceRate}
          value={adh.rate}
          unit="%"
          Icon={CheckCircleIcon}
          color={adh.rate >= 80 ? '#059669' : adh.rate >= 60 ? '#D97706' : '#DC2626'}
          sub={`${adh.taken} / ${adh.total}`}
        />
        <MetricCard
          label={td.heartRate}
          value={vitals.heartRate.value}
          unit="bpm"
          Icon={HeartIcon}
          color="#DC2626"
          sub={hrS === 'normal' ? td.normalRange : td.outOfRange}
        />
        <MetricCard
          label={td.spO2}
          value={vitals.spO2.value}
          unit="%"
          Icon={DropletIcon}
          color={spo2S === 'normal' ? '#0891B2' : '#DC2626'}
          sub={spo2S === 'normal' ? td.normalRange : td.monitorClosely}
        />
      </div>

      {/* ── Two column ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Today's meds */}
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.08)' }}>
                <PillIcon className="w-4 h-4" style={{ color: '#2563EB' }} />
              </div>
              <span className="font-bold text-sm" style={{ color: '#0F172A' }}>{td.todaysMeds}</span>
            </div>
            <span className="pill-blue text-xs px-2.5 py-0.5 rounded-full font-bold">
              {activeMedications.length} {td.active}
            </span>
          </div>

          {activeMedications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                <PillIcon className="w-7 h-7" style={{ color: '#CBD5E1' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: '#64748B' }}>{td.noMeds}</p>
              <button onClick={() => onTabChange('settings')} className="text-xs font-bold mt-1" style={{ color: '#2563EB' }}>
                {td.addMeds}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeMedications.slice(0, 4).map((med, i) => <MedRow key={i} med={med} tx={tx} />)}
              {activeMedications.length > 4 && (
                <button
                  onClick={() => onTabChange('schedule')}
                  className="w-full text-xs py-2.5 rounded-xl font-bold transition-all"
                  style={{ background: '#F8FAFC', color: '#2563EB', border: '1px solid #E2E8F0' }}
                >
                  {td.viewAll(activeMedications.length - 4)}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Vitals */}
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.08)' }}>
                <HeartIcon className="w-4 h-4" style={{ color: '#DC2626' }} />
              </div>
              <span className="font-bold text-sm" style={{ color: '#0F172A' }}>{td.vitalsOverview}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: '#059669' }} />
              <span className="text-xs font-semibold" style={{ color: '#64748B' }}>{td.live}</span>
            </div>
          </div>

          <div className="space-y-4">
            <VBar Icon={HeartIcon}   label={td.heartRate}    value={vitals.heartRate.value} unit="bpm" pct={Math.min((vitals.heartRate.value/120)*100,100)} color="#DC2626" status={hrS} />
            <VBar Icon={DropletIcon} label={td.bloodOxygen}  value={vitals.spO2.value}      unit="%"   pct={vitals.spO2.value}                              color="#0891B2" status={spo2S} />
            <VBar Icon={BrainIcon}   label={td.stressLevel}  value={vitals.stress.value}    unit="%"   pct={vitals.stress.value}                            color="#7C3AED" status={strS} />
            <VBar Icon={MoonIcon}    label={td.sleepQuality} value={vitals.sleep.value}     unit="hrs" pct={Math.min((vitals.sleep.value/9)*100,100)}       color="#6366F1" status={slpS} />
          </div>

          <button
            onClick={() => onTabChange('vitals')}
            className="w-full text-xs py-2.5 rounded-xl font-bold transition-all mt-auto"
            style={{ background: '#F8FAFC', color: '#0891B2', border: '1px solid #E2E8F0' }}
          >
            {td.viewVitals}
          </button>
        </div>
      </div>

      {/* ── Adherence bar ────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={CARD}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(217,119,6,0.08)' }}>
              <BarChartIcon className="w-4 h-4" style={{ color: '#D97706' }} />
            </div>
            <span className="font-bold text-sm" style={{ color: '#0F172A' }}>{td.adherenceSummary}</span>
          </div>
          <span className="font-black text-xl" style={{ color: scoreColor }}>{adh.rate}%</span>
        </div>

        <div className="h-2.5 rounded-full overflow-hidden mb-4" style={{ background: '#F1F5F9' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${adh.rate}%`,
              background: `linear-gradient(90deg, ${scoreColor}cc, ${scoreColor})`,
              transition: 'width 1s ease',
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: td.takenOnTime, value: adh.taken,  color: '#059669', bg: 'rgba(5,150,105,0.06)',  border: 'rgba(5,150,105,0.12)'  },
            { label: td.takenLate,   value: adh.late,   color: '#D97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.12)'  },
            { label: td.missed,      value: adh.missed, color: '#DC2626', bg: 'rgba(220,38,38,0.06)',  border: 'rgba(220,38,38,0.12)'  },
          ].map(({ label, value, color, bg, border }) => (
            <div
              key={label}
              className="rounded-2xl p-3 text-center"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: '#64748B' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Smart action items ────────────────────────────────────────────── */}
      <div>
        <div className="section-divider mb-3"><span>Today's Actions</span></div>
        <div className="space-y-2">
          {actionItems.map((item, i) => (
            <ActionItem key={i} {...item} onTabChange={onTabChange} />
          ))}
        </div>
      </div>
    </div>
  )
}
