// src/components/ConflictBadge.jsx — severity / risk badge
const SEVERITY_STYLES = {
  high:    { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', dot: '#EF4444' },
  medium:  { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', dot: '#F59E0B' },
  low:     { bg: '#F0FDF4', border: '#BBF7D0', text: '#059669', dot: '#10B981' },
  unknown: { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', dot: '#94A3B8' },
}

const TYPE_LABELS = {
  duplicate_therapy:   'Duplicate Therapy',
  dangerous_combination: 'Dangerous Combination',
  counteracting:       'Counteracting',
  cumulative_overdose: 'Cumulative Overdose',
}

export function SeverityBadge({ severity, className = '' }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.unknown
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${className}`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : 'Unknown'}
    </span>
  )
}

export function ConflictTypeBadge({ type, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${className}`}
      style={{ background: 'rgba(109,40,217,0.07)', color: '#7C3AED', border: '1px solid rgba(109,40,217,0.15)' }}
    >
      {TYPE_LABELS[type] || type}
    </span>
  )
}

export function RiskBanner({ risk }) {
  const MAP = {
    high:    { bg: 'linear-gradient(135deg,#EF4444,#DC2626)', label: 'High Risk', sub: 'Dangerous conflicts detected — contact your doctor now' },
    medium:  { bg: 'linear-gradient(135deg,#F59E0B,#D97706)', label: 'Medium Risk', sub: 'Potential conflicts found — discuss with your doctor' },
    low:     { bg: 'linear-gradient(135deg,#10B981,#059669)', label: 'Low Risk',  sub: 'No significant conflicts detected between your prescribers' },
    unknown: { bg: 'linear-gradient(135deg,#94A3B8,#64748B)', label: 'Unknown',   sub: 'Analysis could not be completed' },
  }
  const m = MAP[risk] || MAP.unknown
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ background: m.bg, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
    >
      <div>
        <div className="text-lg font-black" style={{ color: '#fff' }}>{m.label}</div>
        <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.82)' }}>{m.sub}</div>
      </div>
    </div>
  )
}
