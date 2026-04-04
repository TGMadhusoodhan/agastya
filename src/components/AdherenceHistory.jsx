import { useMemo } from 'react'
import { adherenceHistory } from '../data/mockHistory.js'
import { useT } from '../contexts/LanguageContext.jsx'

const STATUS_STYLE = {
  taken: 'bg-emerald-100 text-emerald-700',
  missed: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-700',
}

export default function AdherenceHistory({ patient }) {
  const t  = useT()
  const ta = t.adherence
  const stats = useMemo(() => {
    const total = adherenceHistory.length
    const taken = adherenceHistory.filter((h) => h.status === 'taken').length
    const missed = adherenceHistory.filter((h) => h.status === 'missed').length
    const late = adherenceHistory.filter((h) => h.status === 'late').length
    const rate = total > 0 ? Math.round(((taken + late) / total) * 100) : 0
    return { total, taken, missed, late, rate }
  }, [])

  const handleExport = () => {
    const rows = [
      ['Date', 'Medication', 'Scheduled', 'Taken', 'Status'],
      ...adherenceHistory.map((h) => [h.date, h.medication, h.scheduled, h.taken || '', h.status]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'adherence-history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Adherence rate circle
  const circumference = 2 * Math.PI * 36
  const dashOffset = circumference - (stats.rate / 100) * circumference

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1E3A5F]">{ta.title}</h2>
        <button
          onClick={handleExport}
          className="text-sm border border-[#1E3A5F] text-[#1E3A5F] px-4 py-2 rounded-xl font-semibold hover:bg-[#1E3A5F] hover:text-white transition-all"
        >
          {ta.exportCsv}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
          <svg viewBox="0 0 80 80" className="w-20 h-20">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#E5E7EB" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="#10B981"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              className="transition-all duration-700"
            />
            <text x="40" y="45" textAnchor="middle" className="text-base font-bold" style={{ fontSize: '18px', fontWeight: 'bold', fill: '#1E3A5F' }}>
              {stats.rate}%
            </text>
          </svg>
          <div className="text-xs text-[#6B7280] text-center mt-1">{ta.overall}</div>
        </div>

        {[
          { label: ta.takenOnTime, value: stats.taken, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: ta.takenLate,  value: stats.late,   color: 'text-amber-600',  bg: 'bg-amber-50'   },
          { label: ta.missed,     value: stats.missed,  color: 'text-red-500',    bg: 'bg-red-50'     },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 flex flex-col items-center justify-center`}>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-[#6B7280] text-center mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[ta.date, ta.medication, ta.scheduled, ta.taken, ta.status].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adherenceHistory.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-t border-gray-50 ${
                    row.status === 'taken'
                      ? 'bg-emerald-50/30'
                      : row.status === 'missed'
                      ? 'bg-red-50/30'
                      : 'bg-amber-50/30'
                  }`}
                >
                  <td className="px-4 py-2.5 text-[#1F2937] font-medium text-xs">{row.date}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#1E3A5F] text-xs">{row.medication}</td>
                  <td className="px-4 py-2.5 text-[#6B7280] text-xs">{row.scheduled}</td>
                  <td className="px-4 py-2.5 text-[#6B7280] text-xs">{row.taken || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLE[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
