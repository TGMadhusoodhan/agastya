// src/components/Reconcile.jsx — Agastya Reconcile "Full Picture" view
import { useState } from 'react'
import { RiskBanner, SeverityBadge, ConflictTypeBadge } from './ConflictBadge.jsx'
import DoctorLetter from './DoctorLetter.jsx'
import { RefreshIcon, ShieldIcon, CheckCircleIcon, AlertIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

function ConflictCard({ conflict }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{ border: '1px solid #E2E8F0', background: '#fff', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            <SeverityBadge severity={conflict.severity} />
            <ConflictTypeBadge type={conflict.type} />
          </div>
          <div className="font-semibold text-sm" style={{ color: '#0F172A' }}>
            {conflict.medications?.join(' + ')}
          </div>
        </div>
        <span className="text-lg leading-none mt-0.5 shrink-0" style={{ color: '#94A3B8' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid #F1F5F9' }}>
          <p className="text-sm pt-3" style={{ color: '#334155' }}>{conflict.description}</p>

          {conflict.recommendation && (
            <div className="p-3 rounded-xl text-sm"
              style={{ background: 'rgba(37,99,235,0.06)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.15)' }}>
              <div className="font-semibold mb-0.5 text-xs uppercase tracking-wide">What to do</div>
              {conflict.recommendation}
            </div>
          )}

          {conflict.affectedDoctors?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {conflict.affectedDoctors.map(d => (
                <span key={d} className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Reconcile({ patient, reconcileResult, onReanalyze, analyzing, addToast }) {
  const [showLetter, setShowLetter] = useState(false)
  const t = useT()
  const tr = t.reconcile

  const result = reconcileResult

  // ── Loading state ─────────────────────────────────────────────────────
  if (analyzing) {
    return (
      <div className="space-y-5">
        <div
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 6px 24px rgba(37,99,235,0.22)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1" style={{ color: '#fff' }}>{tr.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{tr.subtitle}</p>
          </div>
        </div>
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full dot-1" style={{ background: '#2563EB' }} />
            <div className="w-3 h-3 rounded-full dot-2" style={{ background: '#3B82F6' }} />
            <div className="w-3 h-3 rounded-full dot-3" style={{ background: '#2563EB' }} />
          </div>
          <p className="font-semibold" style={{ color: '#0F172A' }}>{tr.analyzing}</p>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>{tr.analyzingDesc}</p>
        </div>
      </div>
    )
  }

  // ── No result yet — prompt to run ─────────────────────────────────────
  if (!result) {
    return (
      <div className="space-y-5">
        <div
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 6px 24px rgba(37,99,235,0.22)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1" style={{ color: '#fff' }}>{tr.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{tr.subtitle}</p>
          </div>
        </div>
        <div className="rounded-2xl p-8 text-center space-y-4" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
          <div style={{ color: '#CBD5E1' }}><ShieldIcon className="w-12 h-12 mx-auto" /></div>
          <div>
            <p className="font-bold text-base" style={{ color: '#0F172A' }}>{tr.needsAnalysis}</p>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>{tr.needsAnalysisSub}</p>
          </div>
          <button
            onClick={onReanalyze}
            className="px-6 py-3 rounded-2xl font-bold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
          >
            {tr.runAnalysis}
          </button>
        </div>
      </div>
    )
  }

  const criticalCount = result.conflicts?.filter(c => c.severity === 'high').length || 0
  const totalConflicts = result.totalConflicts || result.conflicts?.length || 0
  const analyzedDate = result.analyzedAt
    ? new Date(result.analyzedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : ''

  // ── Main view ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 6px 24px rgba(37,99,235,0.22)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black" style={{ color: '#fff' }}>{tr.title}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {tr.badge}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{tr.subtitle}</p>
            {analyzedDate && (
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>{tr.lastChecked}: {analyzedDate}</p>
            )}
          </div>
          <button
            onClick={onReanalyze}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <RefreshIcon className="w-3.5 h-3.5" />
            {tr.reanalyze}
          </button>
        </div>
      </div>

      {/* Risk banner */}
      <RiskBanner risk={result.overallRisk} />

      {/* Error state */}
      {result.error && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <span style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }}><AlertIcon className="w-5 h-5" /></span>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#DC2626' }}>{tr.error}</p>
            <p className="text-sm mt-0.5" style={{ color: '#EF4444' }}>{tr.errorSub}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {result.fullPictureSummary && (
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <h3 className="font-black text-sm mb-2 uppercase tracking-wide" style={{ color: '#94A3B8' }}>{tr.summary}</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{result.fullPictureSummary}</p>
        </div>
      )}

      {/* Conflicts */}
      {totalConflicts > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base" style={{ color: '#0F172A' }}>
              {tr.conflicts}
              <span className="ml-2 text-sm font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                {totalConflicts}
              </span>
            </h3>
            {criticalCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: '#FEF2F2', color: '#DC2626' }}>
                {criticalCount} critical
              </span>
            )}
          </div>
          {[...result.conflicts]
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 }
              return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
            })
            .map((conflict, i) => (
              <ConflictCard key={i} conflict={conflict} />
            ))}
        </div>
      ) : (
        <div className="rounded-2xl p-5 flex items-center gap-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <span style={{ color: '#059669', flexShrink: 0 }}><CheckCircleIcon className="w-6 h-6" /></span>
          <div>
            <p className="font-bold text-sm" style={{ color: '#059669' }}>{tr.noConflicts}</p>
            <p className="text-sm mt-0.5" style={{ color: '#10B981' }}>{tr.noConflictsSub}</p>
          </div>
        </div>
      )}

      {/* Safe medications */}
      {result.safeMedications?.length > 0 && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <h3 className="font-black text-base" style={{ color: '#0F172A' }}>{tr.safeMeds}</h3>
          <div className="space-y-2">
            {result.safeMedications.map((med, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                <span style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }}><CheckCircleIcon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: '#0F172A' }}>{med.name}</span>
                    {med.dosage && <span className="text-xs" style={{ color: '#64748B' }}>{med.dosage}</span>}
                    {med.doctor && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: '#F1F5F9', color: '#475569' }}>
                        {med.doctor}
                      </span>
                    )}
                  </div>
                  {med.reason && (
                    <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{med.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor letter */}
      {result.doctorLetterText && (
        <div className="space-y-3">
          <button
            onClick={() => setShowLetter(v => !v)}
            className="w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
          >
            <ShieldIcon className="w-4 h-4" />
            {showLetter ? 'Hide Doctor Letter' : tr.doctorLetter}
          </button>
          {showLetter && (
            <DoctorLetter
              letterText={result.doctorLetterText}
              patient={patient}
              analyzedAt={result.analyzedAt}
            />
          )}
        </div>
      )}
    </div>
  )
}
