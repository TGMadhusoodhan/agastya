// src/components/Dashboard.jsx — Health & Analytics (Behance-style, green)
import { useMemo, useState, useEffect } from 'react'
import { getVitals, getVitalsStatus } from '../utils/healthData.js'
import { adherenceHistory } from '../data/mockHistory.js'
import { useT, useLang } from '../contexts/LanguageContext.jsx'
import { translateNames } from '../utils/claudeApi.js'
import {
  HeartIcon, PillIcon, CheckCircleIcon, CalendarIcon,
  DropletIcon, BrainIcon, MoonIcon, CameraIcon,
  BarChartIcon, UserIcon, SettingsIcon, ClipboardIcon,
} from './Icons.jsx'

// ── Metric card ───────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, Icon, color, sub }) {
  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden group transition-all duration-200 hover:scale-[1.02]"
      style={{ background: 'rgba(10,22,34,0.75)', border: '1px solid rgba(0,232,123,0.1)', backdropFilter: 'blur(20px)' }}
    >
      <div
        className="blob-green w-24 h-24 -top-6 -right-6 opacity-60"
        style={{ background: `radial-gradient(circle, ${color}22 0%, transparent 70%)` }}
      />
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      <div>
        <div className="text-3xl font-black leading-none tracking-tight" style={{ color }}>
          {value}
          <span className="text-sm font-medium ml-1.5" style={{ color: 'var(--t3)' }}>{unit}</span>
        </div>
        <div className="text-xs font-semibold mt-1.5 uppercase tracking-wide" style={{ color: 'var(--t3)' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--t4)' }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Medication row ────────────────────────────────────────────────────────
function MedRow({ med, tx }) {
  const t  = useT()
  const ts = t.schedule
  const slotColor  = med.slot === 'morning' ? '#FFAD00' : med.slot === 'afternoon' ? '#FF7A00' : '#00C8FF'
  const slotLabel  = ts[med.slot] || med.slot
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
      style={{ background: 'rgba(0,232,123,0.04)', border: '1px solid rgba(0,232,123,0.07)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
        style={{ background: 'rgba(0,232,123,0.14)', color: '#00E87B' }}
      >
        {med.compartment || 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: 'var(--t1)' }}>{tx ? tx(med.name) : med.name}</div>
        <div className="text-xs" style={{ color: 'var(--t3)' }}>{med.dosage}</div>
      </div>
      <span
        className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0"
        style={{ background: `${slotColor}18`, color: slotColor }}
      >
        {slotLabel}
      </span>
    </div>
  )
}

// ── Vitals bar row ────────────────────────────────────────────────────────
function VBar({ Icon, label, value, unit, pct, color, status }) {
  const c = status === 'normal' ? color : '#FF4D6A'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: c }} />
          <span className="text-xs font-medium" style={{ color: 'var(--t2)' }}>{label}</span>
        </div>
        <span className="text-xs font-bold" style={{ color: c }}>
          {value} <span className="font-normal" style={{ color: 'var(--t3)' }}>{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: c, boxShadow: `0 0 6px ${c}80`, transition: 'width 1s ease' }}
        />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
export default function Dashboard({ patient, activeMedications, onTabChange }) {
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

  const hrS  = getVitalsStatus(vitals.heartRate)
  const spo2S = getVitalsStatus(vitals.spO2)
  const strS  = getVitalsStatus(vitals.stress)
  const slpS  = getVitalsStatus(vitals.sleep)

  const okCount    = [hrS, spo2S, strS, slpS].filter(s => s === 'normal').length
  const healthScore = Math.min(100, Math.round((adh.rate * 0.55) + (okCount / 4) * 45))
  const scoreColor  = healthScore >= 80 ? '#00E87B' : healthScore >= 60 ? '#FFAD00' : '#FF4D6A'

  const circ    = 2 * Math.PI * 48
  const dashOff = circ - (healthScore / 100) * circ

  const hour   = new Date().getHours()
  const greet  = hour < 12 ? td.goodMorning : hour < 17 ? td.goodAfternoon : td.goodEvening
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const ACTIONS = [
    { label: t.nav.scan,          tab: 'scan',          Icon: CameraIcon,    color: '#00E87B' },
    { label: t.nav.schedule,      tab: 'schedule',      Icon: CalendarIcon,  color: '#00C8FF' },
    { label: t.nav.vitals,        tab: 'vitals',        Icon: HeartIcon,     color: '#FF4D6A' },
    { label: t.nav.history,       tab: 'history',       Icon: BarChartIcon,  color: '#FFAD00' },
    { label: t.nav.prescriptions, tab: 'prescriptions', Icon: ClipboardIcon, color: '#9F6EFF' },
    { label: t.nav.settings,      tab: 'settings',      Icon: SettingsIcon,  color: 'var(--t3)' },
  ]

  return (
    <div className="space-y-5 fade-up">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden p-7"
        style={{ background: 'linear-gradient(145deg,#091A12 0%,#060F18 55%,#04090E 100%)', border: '1px solid rgba(0,232,123,0.14)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
        <div className="blob-green w-64 h-64 -top-16 -left-16" />
        <div className="blob-cyan   w-48 h-48 -bottom-10 right-10" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          {/* Left: greeting */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#00E87B] pulse-live" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#00C864' }}>
                {td.healthAnalytics}
              </span>
            </div>

            <p className="text-base" style={{ color: 'var(--t2)' }}>{greet},</p>
            <h1
              className="text-[2.6rem] font-black leading-none mt-0.5 truncate"
              style={{ color: '#00E87B', textShadow: '0 0 28px rgba(0,232,123,0.35)' }}
            >
              {tx(patient.name).split(' ')[0]}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--t3)' }}>{dateStr}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="pill-green text-xs px-3 py-1 rounded-full font-semibold">{patient.age} {td.yrs}</span>
              <span className="pill-cyan  text-xs px-3 py-1 rounded-full font-semibold">{patient.language}</span>
              {patient.conditions.slice(0, 2).map((c, i) => (
                <span key={i} className="pill-gray text-xs px-3 py-1 rounded-full font-semibold">{tx(c)}</span>
              ))}
            </div>
          </div>

          {/* Right: score ring */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 110 110" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(0,232,123,0.07)" strokeWidth="10" />
                <circle
                  cx="55" cy="55" r="48"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="10"
                  strokeDasharray={circ}
                  strokeDashoffset={dashOff}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 8px ${scoreColor}aa)`, transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black" style={{ color: scoreColor }}>{healthScore}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--t3)' }}>{td.score}</span>
              </div>
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--t3)' }}>{td.healthIndex}</span>
          </div>
        </div>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label={td.activeMeds}
          value={activeMedications.length}
          unit={t.nav.schedule !== t.nav.scan ? '' : 'meds'}
          Icon={PillIcon}
          color="#00E87B"
          sub={td.inDispenser}
        />
        <MetricCard
          label={td.adherenceRate}
          value={adh.rate}
          unit="%"
          Icon={CheckCircleIcon}
          color={adh.rate >= 80 ? '#00E87B' : adh.rate >= 60 ? '#FFAD00' : '#FF4D6A'}
          sub={`${adh.taken} / ${adh.total}`}
        />
        <MetricCard
          label={td.heartRate}
          value={vitals.heartRate.value}
          unit="bpm"
          Icon={HeartIcon}
          color="#FF4D6A"
          sub={hrS === 'normal' ? td.normalRange : td.outOfRange}
        />
        <MetricCard
          label={td.spO2}
          value={vitals.spO2.value}
          unit="%"
          Icon={DropletIcon}
          color={spo2S === 'normal' ? '#00C8FF' : '#FF4D6A'}
          sub={spo2S === 'normal' ? td.normalRange : td.monitorClosely}
        />
      </div>

      {/* ── Two column ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Today's meds */}
        <div
          className="rounded-3xl p-5 flex flex-col gap-4"
          style={{ background: 'rgba(10,22,34,0.75)', border: '1px solid rgba(0,232,123,0.1)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PillIcon className="w-4 h-4" style={{ color: '#00E87B' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{td.todaysMeds}</span>
            </div>
            <span className="pill-green text-xs px-2.5 py-0.5 rounded-full font-bold">
              {activeMedications.length} {td.active}
            </span>
          </div>

          {activeMedications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
              <PillIcon className="w-10 h-10" style={{ color: 'var(--t4)' }} />
              <p className="text-sm" style={{ color: 'var(--t3)' }}>{td.noMeds}</p>
              <button onClick={() => onTabChange('settings')} className="text-xs font-bold mt-1 underline" style={{ color: '#00E87B' }}>
                {td.addMeds}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeMedications.slice(0, 4).map((med, i) => <MedRow key={i} med={med} tx={tx} />)}
              {activeMedications.length > 4 && (
                <button
                  onClick={() => onTabChange('schedule')}
                  className="w-full text-xs py-2.5 rounded-2xl font-bold transition-all"
                  style={{ background: 'rgba(0,232,123,0.06)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.12)' }}
                >
                  {td.viewAll(activeMedications.length - 4)}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Vitals */}
        <div
          className="rounded-3xl p-5 flex flex-col gap-4"
          style={{ background: 'rgba(10,22,34,0.75)', border: '1px solid rgba(0,200,255,0.12)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartIcon className="w-4 h-4" style={{ color: '#00C8FF' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{td.vitalsOverview}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00E87B] pulse-live" />
              <span className="text-xs font-semibold" style={{ color: 'var(--t3)' }}>{td.live}</span>
            </div>
          </div>

          <div className="space-y-4">
            <VBar Icon={HeartIcon}   label={td.heartRate}    value={vitals.heartRate.value} unit="bpm" pct={Math.min((vitals.heartRate.value/120)*100,100)} color="#FF4D6A" status={hrS} />
            <VBar Icon={DropletIcon} label={td.bloodOxygen}  value={vitals.spO2.value}      unit="%"   pct={vitals.spO2.value}                              color="#00C8FF" status={spo2S} />
            <VBar Icon={BrainIcon}   label={td.stressLevel}  value={vitals.stress.value}    unit="%"   pct={vitals.stress.value}                            color="#9F6EFF" status={strS} />
            <VBar Icon={MoonIcon}    label={td.sleepQuality} value={vitals.sleep.value}     unit="hrs" pct={Math.min((vitals.sleep.value/9)*100,100)}       color="#6366F1" status={slpS} />
          </div>

          <button
            onClick={() => onTabChange('vitals')}
            className="w-full text-xs py-2.5 rounded-2xl font-bold transition-all mt-auto"
            style={{ background: 'rgba(0,200,255,0.07)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.15)' }}
          >
            {td.viewVitals}
          </button>
        </div>
      </div>

      {/* ── Adherence bar ────────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-5"
        style={{ background: 'rgba(10,22,34,0.75)', border: '1px solid rgba(0,232,123,0.1)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChartIcon className="w-4 h-4" style={{ color: '#FFAD00' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{td.adherenceSummary}</span>
          </div>
          <span className="font-black text-xl" style={{ color: scoreColor }}>{adh.rate}%</span>
        </div>

        <div className="h-2.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${adh.rate}%`,
              background: 'linear-gradient(90deg, #00C864, #00E87B)',
              boxShadow: '0 0 10px rgba(0,232,123,0.5)',
              transition: 'width 1s ease',
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: td.takenOnTime, value: adh.taken,  color: '#00E87B' },
            { label: td.takenLate,   value: adh.late,   color: '#FFAD00' },
            { label: td.missed,      value: adh.missed, color: '#FF4D6A' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3 text-center"
              style={{ background: `${color}0D`, border: `1px solid ${color}20` }}
            >
              <div className="text-2xl font-black" style={{ color }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div>
        <div className="section-divider mb-3"><span>{td.quickActions}</span></div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACTIONS.map(({ label, tab, Icon, color }) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="rounded-3xl p-4 flex flex-col items-center gap-2.5 transition-all duration-200 hover:scale-105 group"
              style={{ background: 'rgba(10,22,34,0.75)', border: '1px solid rgba(0,232,123,0.08)', backdropFilter: 'blur(20px)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.background = `${color}0A` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,232,123,0.08)'; e.currentTarget.style.background = 'rgba(10,22,34,0.75)' }}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-center leading-tight" style={{ color: 'var(--t2)' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
