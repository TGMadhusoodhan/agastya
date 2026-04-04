// src/components/VitalsPanel.jsx — Samsung Health mock with sparklines
import { useState } from 'react'
import { getVitals, getVitalsStatus, getVitalsColor } from '../utils/healthData.js'
import { HeartIcon, DropletIcon, BrainIcon, MoonIcon, RefreshIcon, LightbulbIcon, PillIcon, CheckCircleIcon, AlertIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

// ── Inline sparkline SVG ─────────────────────────────────────────────────
function Sparkline({ data, color = '#0EA5E9', width = 80, height = 30 }) {
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
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  )
}

// ── Vital card ───────────────────────────────────────────────────────────
function VitalCard({ Icon, label, value, unit, trend, normal, statusColor, bgColor, sparkColor, tv }) {
  return (
    <div className={`rounded-2xl p-5 border ${bgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-6 h-6 text-gray-600" />
          <span className="font-semibold text-gray-700 text-sm">{label}</span>
        </div>
        <span className={`text-xs font-bold flex items-center gap-1 ${statusColor}`}>
          {statusColor.includes('emerald') ? <><CheckCircleIcon className="w-3.5 h-3.5" /> {tv.normal}</> :
           statusColor.includes('red')     ? <><AlertIcon className="w-3.5 h-3.5" /> {tv.high}</> :
           statusColor.includes('sky')     ? <><AlertIcon className="w-3.5 h-3.5" /> {tv.low}</> : '●'}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-gray-800">{value}</span>
          <span className="text-sm text-gray-500 ml-1">{unit}</span>
        </div>
        <Sparkline data={trend} color={sparkColor} />
      </div>

      <p className="text-xs text-gray-400 mt-2">{tv.normalRange} {Array.isArray(normal) ? `${normal[0]}–${normal[1]}` : normal}</p>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
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

  const hrStatus  = getVitalsStatus(vitals.heartRate)
  const spo2Status = getVitalsStatus(vitals.spO2)
  const stressStatus = getVitalsStatus(vitals.stress)
  const sleepStatus  = getVitalsStatus(vitals.sleep)

  const CARDS = [
    {
      Icon: HeartIcon, label: tv.heartRate,
      value: vitals.heartRate.value, unit: vitals.heartRate.unit,
      trend: vitals.heartRate.trend, normal: vitals.heartRate.normal,
      statusColor: getVitalsColor(hrStatus),
      bgColor:     hrStatus === 'normal' ? 'bg-red-50 border-red-100' : hrStatus === 'high' ? 'bg-red-100 border-red-300' : 'bg-sky-50 border-sky-100',
      sparkColor: '#EF4444',
    },
    {
      Icon: DropletIcon, label: tv.bloodOxygen,
      value: vitals.spO2.value, unit: vitals.spO2.unit,
      trend: vitals.spO2.trend, normal: vitals.spO2.normal,
      statusColor: getVitalsColor(spo2Status),
      bgColor:     spo2Status === 'normal' ? 'bg-blue-50 border-blue-100' : 'bg-red-100 border-red-300',
      sparkColor: '#3B82F6',
    },
    {
      Icon: BrainIcon, label: tv.stress,
      value: vitals.stress.value, unit: vitals.stress.unit,
      trend: vitals.stress.trend, normal: vitals.stress.normal,
      statusColor: getVitalsColor(stressStatus),
      bgColor:     stressStatus === 'normal' ? 'bg-purple-50 border-purple-100' : 'bg-amber-50 border-amber-200',
      sparkColor: '#A855F7',
    },
    {
      Icon: MoonIcon, label: tv.sleep,
      value: vitals.sleep.value, unit: vitals.sleep.unit,
      trend: vitals.sleep.trend, normal: vitals.sleep.normal,
      statusColor: getVitalsColor(sleepStatus),
      bgColor:     sleepStatus === 'normal' ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-200',
      sparkColor: '#6366F1',
    },
  ]

  // Build a dynamic health tip
  const tips = []
  if (hrStatus     === 'high') tips.push(tv.tips.hrHigh)
  if (spo2Status   === 'low')  tips.push(tv.tips.spo2Low)
  if (stressStatus === 'high') tips.push(tv.tips.stressHigh)
  if (sleepStatus  === 'low')  tips.push(tv.tips.sleepLow)
  if (tips.length  === 0)      tips.push(tv.tips.allGood)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0EA5E9] rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{tv.title}</h2>
            <p className="text-white/70 text-sm">{tv.liveMonitoring}</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            <RefreshIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? tv.syncing : tv.sync}
          </button>
        </div>
        {/* Samsung Health badge */}
        <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 w-fit">
          <div className="w-2 h-2 bg-green-400 rounded-full pulse-live" />
          <span className="text-white/80 text-xs font-medium">
            {tv.connected}
          </span>
        </div>
        <div className="mt-1 text-white/40 text-xs ml-7">
          {tv.lastSynced} {lastSync.toLocaleTimeString()}
        </div>
      </div>

      {/* Vitals grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map(card => (
          <VitalCard key={card.label} {...card} tv={tv} />
        ))}
      </div>

      {/* Health tip */}
      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5 flex gap-3">
        <LightbulbIcon className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sky-800 mb-1 text-sm">{tv.insight}</h3>
          {tips.map((tip, i) => (
            <p key={i} className="text-sm text-sky-700">{tip}</p>
          ))}
        </div>
      </div>

      {/* Medication interaction notice */}
      {hrStatus === 'high' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <PillIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800 text-sm">{tv.medNote}</div>
            <div className="text-amber-700 text-sm mt-0.5">{tv.metropolol}</div>
          </div>
        </div>
      )}
    </div>
  )
}
