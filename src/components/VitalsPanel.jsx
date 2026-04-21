// src/components/VitalsPanel.jsx
import { useState } from 'react'
import { getVitals, getVitalsStatus, getVitalsColor } from '../utils/healthData.js'
import { HeartIcon, DropletIcon, BrainIcon, MoonIcon, RefreshIcon, LightbulbIcon, PillIcon, CheckCircleIcon, AlertIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

const CARD = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
}

function Sparkline({ data, color = '#059669', width = 80, height = 30 }) {
  if (!data || data.length < 2) return null
  const min   = Math.min(...data)
  const max   = Math.max(...data)
  const range = max - min || 1
  const step  = width / (data.length - 1)
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(' ')
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  )
}

function VitalCard({ Icon, label, value, unit, trend, normal, statusColor, sparkColor, accentColor, tv }) {
  const isGood = statusColor.includes('emerald') || statusColor.includes('green')
  const isHigh = statusColor.includes('red')
  const color  = isHigh ? '#DC2626' : isGood ? accentColor : '#D97706'
  const statusBg     = isHigh ? 'rgba(220,38,38,0.08)'  : isGood ? `${accentColor}10` : 'rgba(217,119,6,0.08)'
  const statusBorder = isHigh ? 'rgba(220,38,38,0.2)'   : isGood ? `${accentColor}25` : 'rgba(217,119,6,0.2)'
  const statusLabel  = isHigh ? tv.high : isGood ? tv.normal : tv.low
  const StatusIcon   = isGood ? CheckCircleIcon : AlertIcon

  return (
    <div className="rounded-2xl p-5 transition-all hover:-translate-y-0.5" style={CARD}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}10` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <span className="font-semibold text-sm" style={{ color: '#334155' }}>{label}</span>
        </div>
        <span
          className="text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: statusBg, color, border: `1px solid ${statusBorder}` }}
        >
          <StatusIcon className="w-3 h-3" /> {statusLabel}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-black" style={{ color }}>
            {value}
          </span>
          <span className="text-sm ml-1" style={{ color: '#94A3B8' }}>{unit}</span>
        </div>
        <Sparkline data={trend} color={color} />
      </div>

      <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>
        {tv.normalRange} {Array.isArray(normal) ? `${normal[0]}–${normal[1]}` : normal}
      </p>
    </div>
  )
}

export default function VitalsPanel({ patient }) {
  const [vitals, setVitals] = useState(() => getVitals())
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(new Date())
  const t  = useT()
  const tv = t.vitals

  const handleSync = async () => {
    setSyncing(true)
    await new Promise(r => setTimeout(r, 900))
    setVitals(getVitals())
    setLastSync(new Date())
    setSyncing(false)
  }

  const hrStatus     = getVitalsStatus(vitals.heartRate)
  const spo2Status   = getVitalsStatus(vitals.spO2)
  const stressStatus = getVitalsStatus(vitals.stress)
  const sleepStatus  = getVitalsStatus(vitals.sleep)

  const CARDS = [
    {
      Icon: HeartIcon,   label: tv.heartRate,
      value: vitals.heartRate.value, unit: vitals.heartRate.unit,
      trend: vitals.heartRate.trend, normal: vitals.heartRate.normal,
      statusColor: getVitalsColor(hrStatus), accentColor: '#DC2626', sparkColor: '#DC2626',
    },
    {
      Icon: DropletIcon, label: tv.bloodOxygen,
      value: vitals.spO2.value, unit: vitals.spO2.unit,
      trend: vitals.spO2.trend, normal: vitals.spO2.normal,
      statusColor: getVitalsColor(spo2Status), accentColor: '#0891B2', sparkColor: '#0891B2',
    },
    {
      Icon: BrainIcon,   label: tv.stress,
      value: vitals.stress.value, unit: vitals.stress.unit,
      trend: vitals.stress.trend, normal: vitals.stress.normal,
      statusColor: getVitalsColor(stressStatus), accentColor: '#7C3AED', sparkColor: '#7C3AED',
    },
    {
      Icon: MoonIcon,    label: tv.sleep,
      value: vitals.sleep.value, unit: vitals.sleep.unit,
      trend: vitals.sleep.trend, normal: vitals.sleep.normal,
      statusColor: getVitalsColor(sleepStatus), accentColor: '#6366F1', sparkColor: '#6366F1',
    },
  ]

  const tips = []
  if (hrStatus     === 'high') tips.push(tv.tips.hrHigh)
  if (spo2Status   === 'low')  tips.push(tv.tips.spo2Low)
  if (stressStatus === 'high') tips.push(tv.tips.stressHigh)
  if (sleepStatus  === 'low')  tips.push(tv.tips.sleepLow)
  if (tips.length  === 0)      tips.push(tv.tips.allGood)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="rounded-2xl p-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 6px 24px rgba(37,99,235,0.22)' }}
      >
        <div>
          <h2 className="text-2xl font-black mb-1" style={{ color: '#fff' }}>{tv.title}</h2>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full pulse-live" style={{ background: '#6EE7B7' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{tv.liveMonitoring}</p>
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {tv.lastSynced} {lastSync.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <RefreshIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? tv.syncing : tv.sync}
        </button>
      </div>

      {/* Vitals grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map(card => <VitalCard key={card.label} {...card} tv={tv} />)}
      </div>

      {/* AI Insight */}
      <div className="rounded-2xl p-5 flex gap-3"
        style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(8,145,178,0.1)' }}>
          <LightbulbIcon className="w-5 h-5" style={{ color: '#0891B2' }} />
        </div>
        <div>
          <h3 className="font-bold text-sm mb-1" style={{ color: '#0891B2' }}>{tv.insight}</h3>
          {tips.map((tip, i) => (
            <p key={i} className="text-sm" style={{ color: '#334155' }}>{tip}</p>
          ))}
        </div>
      </div>

      {/* High HR medication note */}
      {hrStatus === 'high' && (
        <div className="rounded-2xl p-4 flex gap-3"
          style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(217,119,6,0.1)' }}>
            <PillIcon className="w-5 h-5" style={{ color: '#D97706' }} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#D97706' }}>{tv.medNote}</div>
            <div className="text-sm mt-0.5" style={{ color: '#334155' }}>{tv.metropolol}</div>
          </div>
        </div>
      )}
    </div>
  )
}
