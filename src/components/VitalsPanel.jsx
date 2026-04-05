// src/components/VitalsPanel.jsx — dark glass
import { useState } from 'react'
import { getVitals, getVitalsStatus, getVitalsColor } from '../utils/healthData.js'
import { HeartIcon, DropletIcon, BrainIcon, MoonIcon, RefreshIcon, LightbulbIcon, PillIcon, CheckCircleIcon, AlertIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

function Sparkline({ data, color = '#00E87B', width = 80, height = 30 }) {
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
        opacity="0.8"
        style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
      />
    </svg>
  )
}

function VitalCard({ Icon, label, value, unit, trend, normal, statusColor, sparkColor, bgBorder, tv }) {
  const isGood  = statusColor.includes('emerald') || statusColor.includes('green')
  const isHigh  = statusColor.includes('red')
  const accentColor = isHigh ? '#FF4D6A' : isGood ? sparkColor : '#FFAD00'

  return (
    <div
      className="rounded-2xl p-5 transition-all"
      style={{ background: 'rgba(10,22,34,0.8)', border: `1px solid ${bgBorder}`, backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--t2)' }}>{label}</span>
        </div>
        <span
          className="text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}
        >
          {isGood
            ? <><CheckCircleIcon className="w-3 h-3" /> {tv.normal}</>
            : isHigh
            ? <><AlertIcon className="w-3 h-3" /> {tv.high}</>
            : <><AlertIcon className="w-3 h-3" /> {tv.low}</>
          }
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-black" style={{ color: accentColor, textShadow: `0 0 12px ${accentColor}50` }}>
            {value}
          </span>
          <span className="text-sm ml-1" style={{ color: 'var(--t3)' }}>{unit}</span>
        </div>
        <Sparkline data={trend} color={accentColor} />
      </div>

      <p className="text-xs mt-2" style={{ color: 'var(--t4)' }}>
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
      statusColor: getVitalsColor(hrStatus),
      bgBorder: hrStatus === 'normal' ? 'rgba(255,77,106,0.15)' : 'rgba(255,77,106,0.35)',
      sparkColor: '#FF4D6A',
    },
    {
      Icon: DropletIcon, label: tv.bloodOxygen,
      value: vitals.spO2.value, unit: vitals.spO2.unit,
      trend: vitals.spO2.trend, normal: vitals.spO2.normal,
      statusColor: getVitalsColor(spo2Status),
      bgBorder: spo2Status === 'normal' ? 'rgba(0,200,255,0.15)' : 'rgba(255,77,106,0.35)',
      sparkColor: '#00C8FF',
    },
    {
      Icon: BrainIcon,   label: tv.stress,
      value: vitals.stress.value, unit: vitals.stress.unit,
      trend: vitals.stress.trend, normal: vitals.stress.normal,
      statusColor: getVitalsColor(stressStatus),
      bgBorder: stressStatus === 'normal' ? 'rgba(159,110,255,0.15)' : 'rgba(255,173,0,0.25)',
      sparkColor: '#9F6EFF',
    },
    {
      Icon: MoonIcon,    label: tv.sleep,
      value: vitals.sleep.value, unit: vitals.sleep.unit,
      trend: vitals.sleep.trend, normal: vitals.sleep.normal,
      statusColor: getVitalsColor(sleepStatus),
      bgBorder: sleepStatus === 'normal' ? 'rgba(99,102,241,0.15)' : 'rgba(255,173,0,0.25)',
      sparkColor: '#6366F1',
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
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'rgba(10,22,34,0.85)', border: '1px solid rgba(0,200,255,0.18)', backdropFilter: 'blur(20px)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--t1)' }}>{tv.title}</h2>
            <p className="text-sm" style={{ color: 'var(--t3)' }}>{tv.liveMonitoring}</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'rgba(0,200,255,0.1)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.25)' }}
          >
            <RefreshIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? tv.syncing : tv.sync}
          </button>
        </div>

        <div className="relative z-10 mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(0,232,123,0.06)', border: '1px solid rgba(0,232,123,0.12)' }}>
          <div className="w-2 h-2 rounded-full pulse-live" style={{ background: '#00E87B' }} />
          <span className="text-xs font-semibold" style={{ color: '#00E87B' }}>{tv.connected}</span>
        </div>
        <div className="relative z-10 mt-1 ml-7 text-xs" style={{ color: 'var(--t4)' }}>
          {tv.lastSynced} {lastSync.toLocaleTimeString()}
        </div>
      </div>

      {/* Vitals grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map(card => <VitalCard key={card.label} {...card} tv={tv} />)}
      </div>

      {/* AI Insight */}
      <div className="rounded-2xl p-5 flex gap-3" style={{ background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)' }}>
        <LightbulbIcon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#00C8FF' }} />
        <div>
          <h3 className="font-bold text-sm mb-1" style={{ color: '#00C8FF' }}>{tv.insight}</h3>
          {tips.map((tip, i) => (
            <p key={i} className="text-sm" style={{ color: 'var(--t2)' }}>{tip}</p>
          ))}
        </div>
      </div>

      {/* High HR medication note */}
      {hrStatus === 'high' && (
        <div className="rounded-2xl p-4 flex gap-3" style={{ background: 'rgba(255,173,0,0.07)', border: '1px solid rgba(255,173,0,0.2)' }}>
          <PillIcon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#FFAD00' }} />
          <div>
            <div className="font-semibold text-sm" style={{ color: '#FFAD00' }}>{tv.medNote}</div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--t2)' }}>{tv.metropolol}</div>
          </div>
        </div>
      )}
    </div>
  )
}
