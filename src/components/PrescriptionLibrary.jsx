// src/components/PrescriptionLibrary.jsx — dark glass
import { useState, useMemo, useEffect } from 'react'
import { PillIcon, ClipboardIcon, SearchIcon, CalendarIcon, BoxIcon, UserIcon, VolumeIcon } from './Icons.jsx'
import { useT, useLang } from '../contexts/LanguageContext.jsx'
import { translateNames } from '../utils/claudeApi.js'
import { speak } from '../utils/voiceEngine.js'

const CONDITION_COLORS = {
  'Fever & Infections': '#FF4D6A',
  Hypertension:         '#00C8FF',
  Diabetes:             '#FFAD00',
  Respiratory:          '#059669',
  'Mental Health':      '#9F6EFF',
  'Pain/Inflammation':  '#FF6B35',
}

function getConditionColor(cat) {
  return CONDITION_COLORS[cat] || '#64748B'
}

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function PrescriptionCard({ prescription, onView, tp, tx, lang }) {
  const color      = getConditionColor(prescription.conditionCategory)
  const earliest   = prescription.medications
    ?.filter(m => m.expiryDate && m.status !== 'expired')
    .map(m => daysRemaining(m.expiryDate))
    .filter(d => d !== null && d > 0)
    .sort((a, b) => a - b)[0]

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02]"
      style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}
      onClick={() => onView(prescription)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = `0 4px 16px ${color}12` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.05)' }}
    >
      {/* Color top strip */}
      <div className="h-1.5" style={{ background: color }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: 'var(--t1)' }}>
              {tx(prescription.clinicName) || 'Unknown Clinic'}
            </div>
            <div className="text-xs truncate mt-0.5" style={{ color: 'var(--t3)' }}>{tx(prescription.doctorName)}</div>
          </div>
          <span
            className="shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={
              prescription.status === 'active'
                ? { background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.18)' }
                : { background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }
            }
          >
            {prescription.status === 'active' ? tp.active_label : tp.expired_label}
          </span>
        </div>

        {/* Condition tag */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
          <span className="text-xs font-semibold" style={{ color }}>{prescription.conditionCategory || 'Other'}</span>
        </div>

        <div className="text-xs mb-3 line-clamp-1" style={{ color: 'var(--t3)' }}>{prescription.diagnosis}</div>

        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(0,232,123,0.06)' }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--t4)' }}>
            <PillIcon className="w-3.5 h-3.5" />
            <span>{prescription.medications?.length || 0} med{prescription.medications?.length !== 1 ? 's' : ''}</span>
            {prescription.medications?.length > 0 && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  const names = prescription.medications.map(m => m.name).join('. ')
                  speak(names, lang)
                }}
                title="Pronounce medication names"
                className="w-5 h-5 flex items-center justify-center rounded-md transition-all hover:scale-110"
                style={{ background: 'rgba(159,110,255,0.12)', color: '#9F6EFF', border: '1px solid rgba(159,110,255,0.2)' }}
              >
                <VolumeIcon className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {prescription.status === 'active' && earliest !== undefined && (
              <span className="text-xs font-semibold"
                style={{ color: earliest <= 3 ? '#DC2626' : earliest <= 7 ? '#D97706' : '#059669' }}>
                {earliest}d left
              </span>
            )}
            {prescription.status === 'active' && earliest === undefined && (
              <span className="text-xs" style={{ color: 'var(--t4)' }}>{tp.permanent}</span>
            )}
            <span className="text-xs" style={{ color: 'var(--t4)' }}>
              {new Date(prescription.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PrescriptionLibrary({ prescriptions, onView, onScanNew, addToast }) {
  const [viewMode,    setViewMode]    = useState('date')
  const [search,      setSearch]      = useState('')
  const [translated,  setTranslated]  = useState({})
  const t    = useT()
  const lang = useLang()
  const tp   = t.prescriptions


  useEffect(() => {
    if (lang === 'English' || !prescriptions?.length) { setTranslated({}); return }
    const names = prescriptions.flatMap(p => [
      p.clinicName,
      p.doctorName,
    ]).filter(Boolean)
    const unique = [...new Set(names)]
    translateNames(unique, lang).then(setTranslated).catch(() => {})
  }, [prescriptions, lang])

  const tx = name => (name ? translated[name] || name : name)

  const filtered = useMemo(() => {
    if (!search.trim()) return prescriptions
    const q = search.toLowerCase()
    return prescriptions.filter(p =>
      p.clinicName?.toLowerCase().includes(q) ||
      p.doctorName?.toLowerCase().includes(q) ||
      p.diagnosis?.toLowerCase().includes(q) ||
      p.conditionCategory?.toLowerCase().includes(q) ||
      p.patientName?.toLowerCase().includes(q) ||
      p.medications?.some(m => m.name?.toLowerCase().includes(q))
    )
  }, [prescriptions, search])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(p => {
      let key
      if (viewMode === 'date') {
        key = new Date(p.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
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

  const activeCount = prescriptions.filter(p => p.status === 'active').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 6px 24px rgba(37,99,235,0.22)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,232,123,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,232,123,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black" style={{ color: 'var(--t1)' }}>{tp.title}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--t3)' }}>
              {tp.count(prescriptions.length)} · {tp.active(activeCount)}
            </p>
          </div>
          <button
            onClick={onScanNew}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <ClipboardIcon className="w-4 h-4" /> {tp.scanNew}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t4)' }} />
        <input
          type="text"
          placeholder={tp.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-2xl pl-10 pr-4 py-3 text-sm outline-none"
          style={{ background: '#fff', border: '1px solid #E2E8F0', color: '#0F172A', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
        />
      </div>

      {/* View mode tabs */}
      <div
        className="flex gap-1.5 p-1.5 rounded-2xl"
        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
      >
        {[
          { id: 'date',    Icon: CalendarIcon, label: tp.byDate    },
          { id: 'disease', Icon: BoxIcon,      label: tp.byDisease },
          { id: 'doctor',  Icon: UserIcon,     label: tp.byDoctor  },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={
              viewMode === tab.id
                ? { background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }
                : { color: '#64748B', border: '1px solid transparent' }
            }
          >
            <tab.Icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
          <ClipboardIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--t4)' }} />
          <p className="font-bold" style={{ color: 'var(--t1)' }}>{tp.noFound}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{tp.noFoundSub(search)}</p>
          {!search && (
            <button
              onClick={onScanNew}
              className="mt-4 px-5 py-2 rounded-2xl text-sm font-black transition-all"
              style={{ background: 'linear-gradient(135deg,#1D56DB,#2563EB)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.28)' }}
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
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB' }}>
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(p => (
                  <PrescriptionCard key={p.id} prescription={p} onView={onView} tp={tp} tx={tx} lang={lang} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
