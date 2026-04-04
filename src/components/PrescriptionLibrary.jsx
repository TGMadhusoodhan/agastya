import { useState, useMemo } from 'react'
import { PillIcon, ClipboardIcon, SearchIcon, CalendarIcon, BoxIcon, UserIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

const CONDITION_STYLES = {
  'Fever & Infections': { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
  Hypertension:         { bg: '#DBEAFE', color: '#1E40AF', dot: '#3B82F6' },
  Diabetes:             { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  Respiratory:          { bg: '#CCFBF1', color: '#065F46', dot: '#14B8A6' },
  'Mental Health':      { bg: '#F3E8FF', color: '#6B21A8', dot: '#A855F7' },
  'Pain/Inflammation':  { bg: '#FFEDD5', color: '#9A3412', dot: '#F97316' },
}

function getConditionStyle(cat) {
  return CONDITION_STYLES[cat] || { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF' }
}

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function PrescriptionCard({ prescription, onView, tp }) {
  const s = getConditionStyle(prescription.conditionCategory)
  const activeMeds = prescription.medications?.filter((m) => m.status !== 'expired') || []
  const earliest = prescription.medications
    ?.filter((m) => m.expiryDate && m.status !== 'expired')
    .map((m) => daysRemaining(m.expiryDate))
    .filter((d) => d !== null && d > 0)
    .sort((a, b) => a - b)[0]

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      onClick={() => onView(prescription)}
    >
      {/* Colored top strip */}
      <div className="h-1.5" style={{ background: s.dot }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[#1E3A5F] text-sm truncate">{prescription.clinicName || 'Unknown Clinic'}</div>
            <div className="text-xs text-[#6B7280] truncate">{prescription.doctorName}</div>
          </div>
          <span
            className="shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={
              prescription.status === 'active'
                ? { background: '#D1FAE5', color: '#065F46' }
                : { background: '#F3F4F6', color: '#6B7280' }
            }
          >
            {prescription.status === 'active' ? tp.active_label : tp.expired_label}
          </span>
        </div>

        {/* Condition tag */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
          <span className="text-xs font-semibold" style={{ color: s.color }}>
            {prescription.conditionCategory || 'Other'}
          </span>
        </div>

        <div className="text-xs text-[#6B7280] mb-3 line-clamp-1">{prescription.diagnosis}</div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
            <PillIcon className="w-3.5 h-3.5" />
            <span>{prescription.medications?.length || 0} med{prescription.medications?.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            {prescription.status === 'active' && earliest !== undefined && (
              <span className={`text-xs font-semibold ${
                earliest <= 3 ? 'text-red-500' : earliest <= 7 ? 'text-amber-500' : 'text-emerald-600'
              }`}>
                {earliest}d left
              </span>
            )}
            {prescription.status === 'active' && earliest === undefined && (
              <span className="text-xs text-gray-400">{tp.permanent}</span>
            )}
            <span className="text-xs text-[#9CA3AF]">
              {new Date(prescription.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PrescriptionLibrary({ prescriptions, onView, onScanNew, addToast }) {
  const [viewMode, setViewMode] = useState('date')
  const [search, setSearch] = useState('')
  const t  = useT()
  const tp = t.prescriptions

  const filtered = useMemo(() => {
    if (!search.trim()) return prescriptions
    const q = search.toLowerCase()
    return prescriptions.filter(
      (p) =>
        p.clinicName?.toLowerCase().includes(q) ||
        p.doctorName?.toLowerCase().includes(q) ||
        p.diagnosis?.toLowerCase().includes(q) ||
        p.conditionCategory?.toLowerCase().includes(q) ||
        p.patientName?.toLowerCase().includes(q) ||
        p.medications?.some((m) => m.name?.toLowerCase().includes(q))
    )
  }, [prescriptions, search])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach((p) => {
      let key
      if (viewMode === 'date') {
        const d = new Date(p.date)
        key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      } else if (viewMode === 'disease') {
        key = p.conditionCategory || 'Other'
      } else {
        key = p.doctorName || 'Unknown Doctor'
      }
      if (!g[key]) g[key] = []
      g[key].push(p)
    })
    return g
  }, [filtered, viewMode])

  const activeCount = prescriptions.filter((p) => p.status === 'active').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="rounded-2xl p-5 text-white"
        style={{
          background: 'linear-gradient(135deg,#1E3A5F 0%,#1a4a72 60%,#0369a1 100%)',
          boxShadow: '0 8px 24px rgba(30,58,95,0.25)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans',Inter,sans-serif" }}>
              {tp.title}
            </h2>
            <p className="text-sky-200 text-sm mt-0.5">
              {tp.count(prescriptions.length)} · {tp.active(activeCount)}
            </p>
          </div>
          <button
            onClick={onScanNew}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all"
          >
            <ClipboardIcon className="w-4 h-4" /> {tp.scanNew}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder={tp.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border-2 border-gray-100 bg-white rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-sky-400 outline-none shadow-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
        {[
          { id: 'date',    Icon: CalendarIcon, label: tp.byDate    },
          { id: 'disease', Icon: BoxIcon,      label: tp.byDisease },
          { id: 'doctor',  Icon: UserIcon,     label: tp.byDoctor  },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              viewMode === tab.id
                ? 'bg-[#1E3A5F] text-white shadow-md'
                : 'text-[#6B7280] hover:text-[#1E3A5F]'
            }`}
          >
            <tab.Icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center">
          <div className="flex justify-center mb-3"><ClipboardIcon className="w-12 h-12 text-gray-300" /></div>
          <p className="font-bold text-[#1E3A5F]">{tp.noFound}</p>
          <p className="text-sm text-[#9CA3AF] mt-1">{tp.noFoundSub(search)}</p>
          {!search && (
            <button
              onClick={onScanNew}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#1E3A5F,#0369a1)' }}
            >
              {tp.scanFirst}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="section-divider mb-3">
                <span>{group}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: '#1E3A5F' }}
                >
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((p) => (
                  <PrescriptionCard key={p.id} prescription={p} onView={onView} tp={tp} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
