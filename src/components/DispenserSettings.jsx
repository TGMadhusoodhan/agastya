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

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function ExpiryBadge({ med }) {
  const days = med.expiryDate ? daysRemaining(med.expiryDate) : null
  if (!med.autoExpire) {
    return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Permanent — remove manually</span>
  }
  if (days === null) return null
  if (days <= 0) {
    return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full line-through">Expired — removing tomorrow</span>
  }
  if (days <= 2) {
    return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{days} day{days !== 1 ? 's' : ''} remaining</span>
  }
  if (days <= 5) {
    return <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{days} days remaining</span>
  }
  return <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">{days} days remaining</span>
}

function MedCard({ med, onRemove, onToggleExpire, onExtend, onPause }) {
  const [extending, setExtending] = useState(false)

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-3 space-y-2 transition-all ${med.paused ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 bg-[#1E3A5F] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
          {med.compartment || 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[#1E3A5F] text-sm truncate">{med.name}</div>
          <div className="text-xs text-[#6B7280]">{med.dosage} — {med.frequency}</div>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
          med.source === 'prescription' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {med.source || 'manual'}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <ExpiryBadge med={med} />
        {med.paused && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Paused</span>}
      </div>

      {/* Auto-expire toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B7280]">Auto-expire</span>
        <button
          onClick={() => onToggleExpire(med.id, !med.autoExpire)}
          className={`w-10 h-5 rounded-full transition-all relative ${med.autoExpire ? 'bg-emerald-400' : 'bg-gray-200'}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${med.autoExpire ? 'left-5' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Extend */}
      {med.autoExpire && med.expiryDate && (
        <div className="flex gap-1.5">
          <span className="text-xs text-[#6B7280] self-center">Extend:</span>
          {[1, 3, 5].map((d) => (
            <button
              key={d}
              onClick={() => { setExtending(true); onExtend(med.id, d).finally(() => setExtending(false)) }}
              disabled={extending}
              className="text-xs px-2 py-0.5 border border-[#1E3A5F] text-[#1E3A5F] rounded-lg hover:bg-[#1E3A5F] hover:text-white transition-all disabled:opacity-40"
            >
              +{d}d
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onPause(med.id, !med.paused)}
          className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all border ${
            med.paused
              ? 'border-emerald-400 text-emerald-600 hover:bg-emerald-50'
              : 'border-amber-400 text-amber-600 hover:bg-amber-50'
          }`}
        >
          <span className="flex items-center justify-center gap-1">{med.paused ? <><PlayIcon className="w-3 h-3" /> Resume</> : <><PauseIcon className="w-3 h-3" /> Pause</>}</span>
        </button>
        <button
          onClick={() => onRemove(med.id)}
          className="flex-1 text-xs py-1.5 rounded-lg font-semibold border border-red-300 text-red-500 hover:bg-red-50 transition-all"
        >
          Remove
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
  const [section, setSection] = useState('current') // current | expiry | add | status

  useEffect(() => {
    checkDispenserHealth().then(setDispenserStatus)
    getDispenserLog().then(setDispenserLog)
  }, [])

  const meds = activeMedications || []

  const slotGroups = {
    morning: meds.filter((m) => m.slot === 'morning' || m.slot === 'multiple'),
    afternoon: meds.filter((m) => m.slot === 'afternoon' || m.slot === 'multiple'),
    night: meds.filter((m) => m.slot === 'night' || m.slot === 'multiple'),
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
    if (!addForm.name.trim()) {
      addToast('Please enter a medication name', 'error')
      return
    }
    setAdding(true)
    try {
      const compartmentMap = { morning: 1, afternoon: 2, night: 3, multiple: 1 }
      const durationDays = addForm.durationDays ? parseInt(addForm.durationDays) : null
      const today = new Date()
      const expiryDate = durationDays
        ? new Date(today.setDate(today.getDate() + durationDays)).toISOString().split('T')[0]
        : null

      await addMedicationToDispenser({
        name: addForm.name.trim(),
        dosage: addForm.dosage,
        frequency: addForm.frequency,
        slot: addForm.slot,
        compartment: compartmentMap[addForm.slot],
        autoExpire: !!durationDays,
        expiryDate,
        durationDays,
        source: 'manual',
        prescriptionId: null,
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
    { id: 'current', label: 'Current Medications' },
    { id: 'expiry', label: 'Auto-Expiry' },
    { id: 'add', label: 'Add Manually' },
    { id: 'status', label: 'Dispenser Status' },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1E3A5F]">Dispenser Settings</h2>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              section === s.id ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#6B7280] border border-gray-200 hover:border-[#1E3A5F]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* SECTION: Current Medications */}
      {section === 'current' && (
        <div className="space-y-4">
          {Object.entries(slotGroups).map(([slot, meds]) => (
            <div key={slot}>
              <div className="flex items-center gap-2 mb-2">
                {slot === 'morning' ? <SunriseIcon className="w-5 h-5 text-amber-500" /> : slot === 'afternoon' ? <SunIcon className="w-5 h-5 text-orange-500" /> : <MoonIcon className="w-5 h-5 text-blue-500" />}
                <span className="font-semibold text-[#1E3A5F] capitalize">{slot}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{meds.length}</span>
              </div>
              {meds.length === 0 ? (
                <p className="text-sm text-gray-400 pl-7">No medications in this slot</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {meds.map((med) => (
                    <MedCard
                      key={med.id}
                      med={med}
                      onRemove={handleRemove}
                      onToggleExpire={handleToggleExpire}
                      onExtend={handleExtend}
                      onPause={handlePause}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {meds.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-[#6B7280]">
              <div className="flex justify-center mb-2"><PillIcon className="w-10 h-10 text-gray-300" /></div>
              <p className="font-medium">No medications in dispenser</p>
              <p className="text-sm text-[#9CA3AF] mt-1">Add medications manually or scan a prescription</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION: Auto-Expiry Manager */}
      {section === 'expiry' && (
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-3">
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Auto-Expiry Schedule</div>
          {meds.filter((m) => m.autoExpire).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No medications with auto-expiry set</p>
          ) : (
            meds.filter((m) => m.autoExpire).map((med) => {
              const days = med.expiryDate ? daysRemaining(med.expiryDate) : null
              return (
                <div key={med.id} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[#1E3A5F]">{med.name} {med.dosage}</div>
                    <div className="text-xs text-[#6B7280]">
                      Expires: {med.expiryDate}
                      {days !== null && ` (${days <= 0 ? 'expired' : `${days} days`})`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 3, 5].map((d) => (
                      <button
                        key={d}
                        onClick={() => handleExtend(med.id, d)}
                        className="text-xs px-2 py-1 border border-sky-300 text-sky-600 rounded-lg hover:bg-sky-50 transition-all"
                      >
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
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Add Medication Manually</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-[#6B7280]">Medication Name *</label>
              <input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
                placeholder="e.g. Paracetamol"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B7280]">Dosage</label>
              <input
                value={addForm.dosage}
                onChange={(e) => setAddForm({ ...addForm, dosage: e.target.value })}
                className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
                placeholder="e.g. 500mg"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B7280]">Frequency</label>
              <select
                value={addForm.frequency}
                onChange={(e) => setAddForm({ ...addForm, frequency: e.target.value })}
                className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
              >
                {['OD', 'BD', 'TDS', 'QID', 'HS', 'SOS'].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#6B7280]">Time Slot</label>
              <select
                value={addForm.slot}
                onChange={(e) => setAddForm({ ...addForm, slot: e.target.value })}
                className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
              >
                {['morning', 'afternoon', 'night', 'multiple'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#6B7280]">Duration (days, optional)</label>
              <input
                value={addForm.durationDays}
                onChange={(e) => setAddForm({ ...addForm, durationDays: e.target.value })}
                type="number"
                min="1"
                className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
                placeholder="Leave blank = permanent"
              />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-bold hover:bg-[#152d4a] transition-all disabled:opacity-60"
          >
            {adding ? 'Adding...' : '+ Add to Dispenser'}
          </button>
        </div>
      )}

      {/* SECTION: Dispenser Status */}
      {section === 'status' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
            <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Dispenser Status</div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className={`w-4 h-4 rounded-full ${dispenserStatus?.status === 'online' ? 'bg-emerald-400 pulse-live' : 'bg-red-400'}`} />
              <div>
                <div className="font-semibold text-sm">
                  {dispenserStatus?.status === 'online' ? 'Online & Ready' : 'Offline'}
                </div>
                <div className="text-xs text-[#6B7280]">
                  {dispenserStatus?.status === 'online'
                    ? `${dispenserStatus.total_dispenses || 0} total dispenses`
                    : 'Start dispenser-bridge/server.py to connect'}
                </div>
              </div>
            </div>

            {dispenserLog.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[#6B7280] mb-2">Recent Dispenses</div>
                <div className="space-y-2">
                  {dispenserLog.slice(-5).reverse().map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium">{entry.drug} {entry.dose}</span>
                      <span className="text-xs text-[#6B7280]">
                        {entry.tray || `Compartment ${entry.compartment}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[
                { slot: 'Morning', comp: 1, color: 'bg-yellow-50 border-yellow-200' },
                { slot: 'Afternoon', comp: 2, color: 'bg-orange-50 border-orange-200' },
                { slot: 'Night', comp: 3, color: 'bg-blue-50 border-blue-200' },
              ].map(({ slot, comp, color }) => (
                <div key={slot} className={`border rounded-xl p-3 text-center ${color}`}>
                  <div className="text-xs text-[#6B7280]">{slot}</div>
                  <div className="font-bold text-lg text-[#1E3A5F]">{comp}</div>
                  <div className="text-xs text-emerald-600">
                    {meds.filter((m) => m.compartment === comp).length > 0 ? 'Loaded' : 'Empty'}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleTestDispense}
              disabled={testDispensing}
              className="w-full border-2 border-[#1E3A5F] text-[#1E3A5F] py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1E3A5F] hover:text-white transition-all disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-1.5">{testDispensing ? 'Testing...' : <><FlaskIcon className="w-4 h-4" /> Test Dispense</>}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
