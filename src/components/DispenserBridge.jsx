import { useState, useEffect } from 'react'
import { triggerDispenser, checkDispenserHealth } from '../utils/dispenser.js'
import { PillIcon } from './Icons.jsx'

export default function DispenserBridge({ compartment, drug, dose, addToast }) {
  const [status, setStatus] = useState('idle') // idle | dispensing | success | offline | error
  const [online, setOnline] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    checkDispenserHealth().then((h) => setOnline(h.status === 'online'))
  }, [])

  const handleDispense = async () => {
    setStatus('dispensing')
    try {
      const res = await triggerDispenser(compartment, drug, dose)
      if (res.success) {
        setStatus('success')
        setResult(res)
        addToast(`${drug} dispensed — Compartment ${compartment}`, 'success')
      } else if (res.offline) {
        setStatus('offline')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const trayName = compartment === 1 ? 'Morning' : compartment === 2 ? 'Afternoon' : 'Night'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">AI Dispenser</div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className={`w-2 h-2 rounded-full ${online === null ? 'bg-gray-300' : online ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className={online === null ? 'text-gray-400' : online ? 'text-emerald-600' : 'text-red-500'}>
            {online === null ? 'Checking...' : online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Medication info */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
        <div className="w-10 h-10 bg-[#1E3A5F] rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
          {compartment}
        </div>
        <div>
          <div className="font-semibold text-[#1E3A5F] text-sm">{drug}</div>
          <div className="text-xs text-[#6B7280]">{dose} — AI routed to {trayName} Tray</div>
        </div>
      </div>

      {/* Status display */}
      {status === 'dispensing' && (
        <div className="flex items-center justify-center gap-3 py-3 bg-sky-50 rounded-xl">
          <div className="w-4 h-4 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
          <span className="text-sm text-sky-700 font-medium">Dispensing {drug}...</span>
        </div>
      )}

      {status === 'success' && result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
          <div className="font-semibold">✓ Tablet dispensed successfully</div>
          <div className="text-xs mt-0.5">{result.message}</div>
          <div className="text-xs text-emerald-500 mt-0.5">
            {new Date(result.timestamp || Date.now()).toLocaleTimeString()}
          </div>
        </div>
      )}

      {status === 'offline' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          <div className="font-semibold">Dispenser Offline</div>
          <div className="text-xs mt-0.5">Please take {drug} {dose} manually from the {trayName} compartment.</div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          Dispense failed. Please take medication manually.
        </div>
      )}

      {/* Dispense button */}
      {status !== 'dispensing' && status !== 'success' && (
        <button
          onClick={handleDispense}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            online === false
              ? 'bg-gray-100 text-gray-400 cursor-default'
              : 'bg-[#1E3A5F] text-white hover:bg-[#152d4a]'
          }`}
          disabled={online === false}
        >
          {online === false ? 'Dispenser Offline' : <span className="flex items-center justify-center gap-1.5"><PillIcon className="w-4 h-4" /> Dispense Now — {trayName} Tray</span>}
        </button>
      )}

      {status === 'success' && (
        <button
          onClick={() => setStatus('idle')}
          className="w-full py-2 text-sm text-[#6B7280] border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
        >
          Dispense Again
        </button>
      )}
    </div>
  )
}
