// src/components/AdherenceHistory.jsx
import { useMemo } from 'react'
import { adherenceHistory } from '../data/mockHistory.js'
import { useT } from '../contexts/LanguageContext.jsx'

const STATUS_STYLE = {
  taken:  { bg: 'rgba(5,150,105,0.08)',  color: '#059669', border: 'rgba(5,150,105,0.18)'  },
  missed: { bg: 'rgba(220,38,38,0.08)',  color: '#DC2626', border: 'rgba(220,38,38,0.18)'  },
  late:   { bg: 'rgba(217,119,6,0.08)',  color: '#D97706', border: 'rgba(217,119,6,0.18)'  },
}

const CARD = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
}

export default function AdherenceHistory({ patient }) {
  const t  = useT()
  const ta = t.adherence

  const stats = useMemo(() => {
    const total  = adherenceHistory.length
    const taken  = adherenceHistory.filter(h => h.status === 'taken').length
    const missed = adherenceHistory.filter(h => h.status === 'missed').length
    const late   = adherenceHistory.filter(h => h.status === 'late').length
    const rate   = total > 0 ? Math.round(((taken + late) / total) * 100) : 0
    return { total, taken, missed, late, rate }
  }, [])

  const handleExport = () => {
    const rows = [
      ['Date', 'Medication', 'Scheduled', 'Taken', 'Status'],
      ...adherenceHistory.map(h => [h.date, h.medication, h.scheduled, h.taken || '', h.status]),
    ]
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'adherence-history.csv' })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const circumference = 2 * Math.PI * 36
  const dashOffset    = circumference - (stats.rate / 100) * circumference
  const scoreColor    = stats.rate >= 80 ? '#059669' : stats.rate >= 60 ? '#D97706' : '#DC2626'

  return (
    <div className="space-y-4">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: '#0F172A' }}>{ta.title}</h2>
        <button
          onClick={handleExport}
          className="text-sm px-4 py-2 rounded-xl font-semibold transition-all"
          style={{ background: '#F8FAFC', color: '#2563EB', border: '1px solid #E2E8F0' }}
        >
          {ta.exportCsv}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Ring */}
        <div className="rounded-2xl p-4 flex flex-col items-center" style={CARD}>
          <svg viewBox="0 0 80 80" className="w-20 h-20">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#F1F5F9" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 0.7s ease' }}
            />
            <text x="40" y="45" textAnchor="middle" style={{ fontSize: '16px', fontWeight: '900', fill: scoreColor }}>
              {stats.rate}%
            </text>
          </svg>
          <div className="text-xs text-center mt-1 font-semibold" style={{ color: '#64748B' }}>{ta.overall}</div>
        </div>

        {[
          { label: ta.takenOnTime, value: stats.taken,  color: '#059669', bg: 'rgba(5,150,105,0.06)',  border: 'rgba(5,150,105,0.12)'  },
          { label: ta.takenLate,   value: stats.late,   color: '#D97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.12)'  },
          { label: ta.missed,      value: stats.missed, color: '#DC2626', bg: 'rgba(220,38,38,0.06)',  border: 'rgba(220,38,38,0.12)'  },
        ].map(({ label, value, color, bg, border }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex flex-col items-center justify-center"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div className="text-3xl font-black" style={{ color }}>{value}</div>
            <div className="text-xs text-center mt-1 font-semibold" style={{ color: '#64748B' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={CARD}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {[ta.date, ta.medication, ta.scheduled, ta.taken, ta.status].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide"
                    style={{ color: '#64748B' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adherenceHistory.map((row, idx) => {
                const s = STATUS_STYLE[row.status] || STATUS_STYLE.taken
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: idx % 2 === 0 ? '#fff' : '#FAFAFA',
                    }}
                  >
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: '#64748B' }}>{row.date}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#0F172A' }}>{row.medication}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#64748B' }}>{row.scheduled}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#64748B' }}>{row.taken || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
