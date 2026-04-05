// src/components/AdherenceHistory.jsx — dark glass
import { useMemo } from 'react'
import { adherenceHistory } from '../data/mockHistory.js'
import { useT } from '../contexts/LanguageContext.jsx'

const STATUS_STYLE = {
  taken:  { bg: 'rgba(0,232,123,0.1)',  color: '#00E87B',  border: 'rgba(0,232,123,0.2)'  },
  missed: { bg: 'rgba(255,77,106,0.1)', color: '#FF4D6A',  border: 'rgba(255,77,106,0.2)'  },
  late:   { bg: 'rgba(255,173,0,0.1)',  color: '#FFAD00',  border: 'rgba(255,173,0,0.2)'   },
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
  const scoreColor    = stats.rate >= 80 ? '#00E87B' : stats.rate >= 60 ? '#FFAD00' : '#FF4D6A'

  return (
    <div className="space-y-4">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black" style={{ color: 'var(--t1)' }}>{ta.title}</h2>
        <button
          onClick={handleExport}
          className="text-sm px-4 py-2 rounded-2xl font-semibold transition-all"
          style={{ background: 'rgba(0,232,123,0.07)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.2)' }}
        >
          {ta.exportCsv}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Ring */}
        <div className="rounded-2xl p-4 flex flex-col items-center"
          style={{ background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.1)', backdropFilter: 'blur(20px)' }}>
          <svg viewBox="0 0 80 80" className="w-20 h-20">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(0,232,123,0.08)" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ filter: `drop-shadow(0 0 6px ${scoreColor})`, transition: 'stroke-dashoffset 0.7s ease' }}
            />
            <text x="40" y="45" textAnchor="middle" style={{ fontSize: '16px', fontWeight: '900', fill: scoreColor }}>
              {stats.rate}%
            </text>
          </svg>
          <div className="text-xs text-center mt-1" style={{ color: 'var(--t3)' }}>{ta.overall}</div>
        </div>

        {[
          { label: ta.takenOnTime, value: stats.taken,  color: '#00E87B' },
          { label: ta.takenLate,  value: stats.late,   color: '#FFAD00' },
          { label: ta.missed,     value: stats.missed, color: '#FF4D6A' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex flex-col items-center justify-center"
            style={{ background: 'rgba(10,22,34,0.8)', border: `1px solid ${color}22`, backdropFilter: 'blur(20px)' }}
          >
            <div className="text-3xl font-black" style={{ color, textShadow: `0 0 12px ${color}50` }}>
              {value}
            </div>
            <div className="text-xs text-center mt-1" style={{ color: 'var(--t3)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.1)', backdropFilter: 'blur(20px)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm data-table">
            <thead>
              <tr>
                {[ta.date, ta.medication, ta.scheduled, ta.taken, ta.status].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide"
                    style={{ color: '#00E87B', background: 'rgba(0,232,123,0.04)', borderBottom: '1px solid rgba(0,232,123,0.1)' }}
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
                      borderBottom: '1px solid rgba(0,232,123,0.04)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(0,232,123,0.01)',
                    }}
                  >
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--t2)' }}>{row.date}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--t1)' }}>{row.medication}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--t3)' }}>{row.scheduled}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--t3)' }}>{row.taken || '—'}</td>
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
