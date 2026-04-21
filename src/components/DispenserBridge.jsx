// src/components/DispenserBridge.jsx — Countdown + Blender + Email
import { useState, useEffect, useRef } from 'react'
import emailjs from '@emailjs/browser'
import { PillIcon } from './Icons.jsx'
import { auth } from '../utils/firebase.js'

// ── Countdown config ────────────────────────────────────────────────────────
const COUNT_CFG = {
  3: { color: '#D97706', bg: '#FFFBEB',   label: 'Preparing dispenser...'    },
  2: { color: '#EA580C', bg: '#FFF7ED',   label: 'Activating compartment...' },
  1: { color: '#DC2626', bg: '#FEF2F2',   label: 'Dispensing...'             },
  0: { color: '#059669', bg: '#F0FDF4',   label: 'Releasing tablet...'       },
}

const STEP_LABELS = ['Command sent', 'Animation playing', 'Email sending']

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function pollForCompletion(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(1000)
    try {
      const res  = await fetch('http://localhost:5000/status')
      const data = await res.json()
      if (data.status === 'complete') return true
    } catch {
      // server busy during animation — keep polling
    }
  }
  return false
}

// ── Animated checkmark SVG ──────────────────────────────────────────────────
function Checkmark() {
  return (
    <>
      <style>{`
        @keyframes draw-circle { to { stroke-dashoffset: 0 } }
        @keyframes draw-check  { to { stroke-dashoffset: 0 } }
        @keyframes pop-in      { 0%{opacity:0;transform:scale(0.5)} 60%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
        .check-circle { stroke-dasharray:163; stroke-dashoffset:163; animation: draw-circle 0.5s ease forwards 0.1s }
        .check-tick   { stroke-dasharray:50;  stroke-dashoffset:50;  animation: draw-check  0.4s ease forwards 0.6s }
        .check-wrap   { animation: pop-in 0.3s ease forwards }
      `}</style>
      <div className="check-wrap" style={{ opacity: 0 }}>
        <svg viewBox="0 0 52 52" className="w-20 h-20">
          <circle className="check-circle" cx="26" cy="26" r="25"
            fill="none" stroke="#059669" strokeWidth="2" />
          <path className="check-tick"
            d="M14 26 l8 8 l16-16"
            fill="none" stroke="#059669" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  )
}

// ── Step pill ───────────────────────────────────────────────────────────────
function StepPill({ label, done, active }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all"
      style={
        done   ? { background: '#F0FDF4', color: '#059669', border: '1px solid #BBF7D0' }
        : active ? { background: '#F0F9FF', color: '#0891B2', border: '1px solid #BAE6FD' }
                : { background: '#F8FAFC', color: '#94A3B8', border: '1px solid #E2E8F0' }
      }
    >
      {done ? '✓' : active ? (
        <span className="inline-block w-3 h-3 border-2 rounded-full animate-spin"
          style={{ borderColor: '#BAE6FD', borderTopColor: '#0891B2' }} />
      ) : '○'}
      {label}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function DispenserBridge({ compartment, drug, dose, addToast, patientName }) {
  const [phase,       setPhase]       = useState('idle')
  const [countdown,   setCountdown]   = useState(3)
  const [statusMsg,   setStatusMsg]   = useState('')
  const [dispStep,    setDispStep]    = useState(0)
  const [dispensedAt, setDispensedAt] = useState(null)
  const resetRef = useRef(null)

  const trayName = compartment === 1 ? 'Morning' : compartment === 2 ? 'Afternoon' : 'Night'

  useEffect(() => () => clearTimeout(resetRef.current), [])

  // ── Email ─────────────────────────────────────────────────────────────────
  const sendEmail = async (result) => {
    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_DISPENSER_TEMPLATE_ID,
        {
          to_email:        'tgmadhusoodhan@gmail.com',
          to_name:         'Madhusoodhan',
          medication_name: drug,
          dosage:          dose,
          dispensed_time:  new Date().toLocaleString(),
          tray:            result?.tray || trayName,
          patient_name:    patientName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Patient',
          status:          result?.tray ? 'Successfully Dispensed' : 'Dispenser Offline — Manual Required',
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
    } catch (e) {
      console.warn('DispenserBridge: email failed:', e)
    }
  }

  // ── Main flow ─────────────────────────────────────────────────────────────
  const handleDispense = async () => {
    setPhase('countdown')
    setCountdown(3); await sleep(1000)
    setCountdown(2); await sleep(1000)
    setCountdown(1); await sleep(1000)
    setCountdown(0); await sleep(700)

    setPhase('dispensing')
    setDispStep(0)
    setStatusMsg('Sending to Agastya Dispenser...')

    let result = null
    try {
      const response = await fetch('http://localhost:5000/dispense', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ compartment, drug, dose, timestamp: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error('Dispenser error')
      result = await response.json()

      setDispStep(1)
      setStatusMsg('Blender simulation playing...')
      await pollForCompletion()

      setDispStep(2)
      setStatusMsg('Sending confirmation email...')
      await sendEmail(result)

      setDispStep(3)
      setPhase('complete')
      setDispensedAt(new Date().toLocaleTimeString())
      addToast?.(`${drug} dispensed successfully`, 'success')
      resetRef.current = setTimeout(reset, 5000)

    } catch {
      setPhase('offline')
      await sendEmail({ tray: null })
      addToast?.(`${drug} — dispenser offline, take manually`, 'info')
    }
  }

  const reset = () => {
    clearTimeout(resetRef.current)
    setPhase('idle'); setCountdown(3); setDispStep(0); setDispensedAt(null)
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  const card = { background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', borderRadius: '1.5rem', padding: '1.5rem' }

  // ── idle ─────────────────────────────────────────────────────────────────
  if (phase === 'idle') return (
    <div style={card} className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>AI Dispenser</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full pulse-live" style={{ background: '#059669' }} />
          <span className="text-xs font-semibold" style={{ color: '#059669' }}>Ready</span>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-2xl"
        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shrink-0"
          style={{ background: 'rgba(5,150,105,0.12)', color: '#059669' }}>
          {compartment}
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#0F172A' }}>{drug}</div>
          <div className="text-xs" style={{ color: '#64748B' }}>{dose} — {trayName} Tray</div>
        </div>
      </div>

      <button
        onClick={handleDispense}
        className="w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg,#1D56DB,#2563EB)', color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.25)' }}
      >
        <PillIcon className="w-4 h-4" /> Dispense Now — {trayName} Tray
      </button>
    </div>
  )

  // ── countdown ────────────────────────────────────────────────────────────
  if (phase === 'countdown') {
    const cfg = COUNT_CFG[countdown]
    return (
      <div style={{ ...card, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
        className="space-y-4 text-center">
        <style>{`
          @keyframes count-pulse {
            0%,100% { transform: scale(1);   opacity:1 }
            50%      { transform: scale(1.08); opacity:.85 }
          }
          .count-num { animation: count-pulse 0.9s ease-in-out infinite }
        `}</style>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748B' }}>Dispenser Countdown</span>
          <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
        </div>

        <div
          className="count-num font-black leading-none"
          style={{ fontSize: 96, color: cfg.color, letterSpacing: '-0.05em' }}
        >
          {countdown || '✓'}
        </div>

        <div className="text-sm font-semibold" style={{ color: '#334155' }}>{cfg.label}</div>

        <div className="flex items-center gap-2 justify-center">
          {[3, 2, 1].map(n => (
            <div key={n} className="w-8 h-1 rounded-full transition-all duration-500"
              style={{ background: countdown <= n ? cfg.color : '#E2E8F0' }} />
          ))}
        </div>
      </div>
    )
  }

  // ── dispensing ───────────────────────────────────────────────────────────
  if (phase === 'dispensing') return (
    <div style={card} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 rounded-full animate-spin shrink-0"
          style={{ borderColor: '#BAE6FD', borderTopColor: '#0891B2' }} />
        <span className="text-sm font-semibold" style={{ color: '#0891B2' }}>{statusMsg}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEP_LABELS.map((label, i) => (
          <StepPill key={label} label={label} done={dispStep > i} active={dispStep === i} />
        ))}
      </div>

      <div className="rounded-2xl p-3 flex items-center gap-3"
        style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black"
          style={{ background: 'rgba(8,145,178,0.12)', color: '#0891B2' }}>
          {compartment}
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>{drug}</div>
          <div className="text-xs" style={{ color: '#64748B' }}>{dose} — {trayName} Tray</div>
        </div>
      </div>
    </div>
  )

  // ── complete ─────────────────────────────────────────────────────────────
  if (phase === 'complete') return (
    <div style={{ ...card, border: '1px solid #BBF7D0', background: '#F0FDF4' }} className="space-y-4 text-center">
      <div className="flex justify-center">
        <Checkmark />
      </div>

      <div>
        <div className="font-black text-base" style={{ color: '#059669' }}>
          {drug} {dose} dispensed successfully
        </div>
        <div className="text-xs mt-1" style={{ color: '#64748B' }}>Dispensed at {dispensedAt}</div>
        <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>
          Confirmation sent to tgmadhusoodhan@gmail.com
        </div>
      </div>

      <div className="text-xs text-center" style={{ color: '#94A3B8' }}>
        Auto-resetting in 5s…
      </div>

      <button
        onClick={reset}
        className="w-full py-2.5 rounded-2xl font-bold text-sm transition-all"
        style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid #BBF7D0' }}
      >
        Dispense Again
      </button>
    </div>
  )

  // ── offline ──────────────────────────────────────────────────────────────
  if (phase === 'offline') return (
    <div style={{ ...card, border: '1px solid #FDE68A', background: '#FFFBEB' }} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-2xl">⚠️</div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#D97706' }}>Dispenser is offline</div>
          <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
            Take {drug} {dose} manually from the {trayName} compartment
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-3 text-sm"
        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <span style={{ color: '#059669' }}>✓ </span>
        <span style={{ color: '#334155' }}>
          Email notification sent to tgmadhusoodhan@gmail.com
        </span>
      </div>

      <button
        onClick={reset}
        className="w-full py-2.5 rounded-2xl font-bold text-sm transition-all"
        style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}
      >
        Retry Connection
      </button>
    </div>
  )

  // ── error ────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...card, border: '1px solid #FECACA', background: '#FEF2F2' }} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626' }}>✕</div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#DC2626' }}>Dispenser encountered an error</div>
          <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>Please take medication manually</div>
        </div>
      </div>

      <button onClick={reset}
        className="w-full py-2.5 rounded-2xl font-bold text-sm transition-all"
        style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
        Retry
      </button>
    </div>
  )
}
