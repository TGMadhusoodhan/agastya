// src/components/PrescriptionDetail.jsx — light medical
import { useState, useEffect } from 'react'
import { deletePrescription } from '../utils/prescriptionDB.js'
import DispenserBridge from './DispenserBridge.jsx'
import { useT, useLang } from '../contexts/LanguageContext.jsx'
import { translateNames } from '../utils/claudeApi.js'
import { speak } from '../utils/voiceEngine.js'
import { VolumeIcon } from './Icons.jsx'

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function MedStatusBadge({ med, tp, ts }) {
  const days = med.expiryDate ? daysRemaining(med.expiryDate) : null

  if (med.status === 'expired' || (days !== null && days <= 0)) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full line-through"
        style={{ background: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0' }}>
        {tp.expired_label}
      </span>
    )
  }
  if (days !== null) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
        style={
          days <= 3
            ? { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }
            : days <= 7
            ? { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }
            : { background: '#F0FDF4', color: '#059669', border: '1px solid #BBF7D0' }
        }>
        {ts.daysLeft(days)}
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full"
      style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }}>
      {tp.permanent}
    </span>
  )
}

export default function PrescriptionDetail({ prescription, onBack, onMedicationsChanged, addToast }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [dispensingMed, setDispensingMed] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [translated, setTranslated] = useState({})
  const t    = useT()
  const lang = useLang()
  const tc   = t.common
  const tp   = t.prescriptions
  const tps  = t.prescriptionScanner

  useEffect(() => {
    if (!prescription || lang === 'English') { setTranslated({}); return }
    const names = [
      prescription.clinicName,
      prescription.doctorName,
      ...(prescription.medications || []).map(m => m.name),
    ].filter(Boolean)
    translateNames(names, lang).then(setTranslated).catch(() => {})
  }, [prescription?.id, lang])

  if (!prescription) return null

  const tx = name => translated[name] || name

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deletePrescription(prescription.id)
      await onMedicationsChanged()
      addToast('Prescription deleted', 'info')
      onBack()
    } catch (err) {
      console.error(err)
      addToast('Failed to delete prescription', 'error')
    } finally { setDeleting(false) }
  }

  const handleShare = () => {
    const meds = prescription.medications?.map((m) => `• ${m.name} ${m.dosage} — ${m.frequency}`).join('\n') || ''
    const text = `Prescription from ${prescription.clinicName}\nDoctor: ${prescription.doctorName}\nDate: ${prescription.date}\nDiagnosis: ${prescription.diagnosis}\n\nMedications:\n${meds}`
    if (navigator.share) {
      navigator.share({ title: 'Prescription', text })
    } else {
      navigator.clipboard.writeText(text)
      addToast('Prescription copied to clipboard', 'success')
    }
  }

  const cardStyle = { background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', borderRadius: '1.5rem', padding: '1.5rem' }

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold transition-all"
        style={{ color: '#2563EB' }}
      >
        ← {tc.back}
      </button>

      {/* Header card */}
      <div style={cardStyle} className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black" style={{ color: '#0F172A' }}>{tx(prescription.clinicName)}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>{tx(prescription.doctorName)}</p>
            {prescription.doctorPhone && (
              <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{prescription.doctorPhone}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm" style={{ color: '#64748B' }}>
              {new Date(prescription.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold"
              style={
                prescription.status === 'active'
                  ? { background: '#F0FDF4', color: '#059669', border: '1px solid #BBF7D0' }
                  : { background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }
              }>
              {prescription.status === 'active' ? tp.active_label : tp.expired_label}
            </span>
          </div>
        </div>

        {/* Patient / Diagnosis info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl p-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>{tps.patient}</div>
            <div className="font-bold text-sm" style={{ color: '#0F172A' }}>{prescription.patientName}</div>
            <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{prescription.patientAge} yrs, {prescription.patientSex}</div>
          </div>
          <div className="rounded-2xl p-3 col-span-1 sm:col-span-2" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: '#64748B' }}>{tps.diagnosis}</div>
            <div className="font-bold text-sm" style={{ color: '#0F172A' }}>{prescription.diagnosis}</div>
          </div>
        </div>

        {/* Vitals */}
        {prescription.vitals && Object.values(prescription.vitals).some(Boolean) && (
          <div className="rounded-2xl p-3" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <div className="text-xs font-bold mb-2" style={{ color: '#0891B2' }}>{tps.visitVitals}</div>
            <div className="flex flex-wrap gap-4">
              {prescription.vitals.bp     && <div className="text-center"><div className="text-xs" style={{ color: '#64748B' }}>BP</div><div className="font-bold text-sm" style={{ color: '#0F172A' }}>{prescription.vitals.bp}</div></div>}
              {prescription.vitals.hr     && <div className="text-center"><div className="text-xs" style={{ color: '#64748B' }}>HR</div><div className="font-bold text-sm" style={{ color: '#0F172A' }}>{prescription.vitals.hr} bpm</div></div>}
              {prescription.vitals.spo2   && <div className="text-center"><div className="text-xs" style={{ color: '#64748B' }}>SpO2</div><div className="font-bold text-sm" style={{ color: '#0F172A' }}>{prescription.vitals.spo2}%</div></div>}
              {prescription.vitals.temp   && <div className="text-center"><div className="text-xs" style={{ color: '#64748B' }}>Temp</div><div className="font-bold text-sm" style={{ color: '#0F172A' }}>{prescription.vitals.temp}°F</div></div>}
              {prescription.vitals.weight && <div className="text-center"><div className="text-xs" style={{ color: '#64748B' }}>Weight</div><div className="font-bold text-sm" style={{ color: '#0F172A' }}>{prescription.vitals.weight}</div></div>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 py-2 rounded-2xl font-semibold text-sm transition-all"
            style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            {tc.share}
          </button>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
            >
              {tc.delete}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-2xl font-semibold text-sm"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
              >
                {deleting ? '…' : tc.confirm}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-2xl font-semibold text-sm"
                style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}
              >
                {tc.cancel}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prescription image */}
      {prescription.imageBlob && (
        <div style={cardStyle}>
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#64748B' }}>{tps.review}</div>
          <img
            src={URL.createObjectURL(prescription.imageBlob)}
            alt="Original prescription"
            className="w-full rounded-2xl"
            style={{ border: '1px solid #E2E8F0' }}
          />
        </div>
      )}

      {/* Medications */}
      <div style={cardStyle} className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wide" style={{ color: '#64748B' }}>
          {tps.medications} ({prescription.medications?.length || 0})
        </div>
        {(prescription.medications || []).map((med, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-4"
            style={{
              background: med.status === 'expired' ? '#F8FAFC' : '#F0FDF4',
              border: '1px solid #E2E8F0',
              opacity: med.status === 'expired' ? 0.7 : 1,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold" style={{ color: '#0F172A' }}>{tx(med.name)}</span>
                  {med.dosage && <span className="text-sm" style={{ color: '#64748B' }}>{med.dosage}</span>}
                  <MedStatusBadge med={med} tp={tp} ts={t.schedule} />
                  <button
                    onClick={() => speak(`${med.name}. ${med.dosage || ''}`, lang)}
                    title="Pronounce medication name"
                    className="w-6 h-6 flex items-center justify-center rounded-lg transition-all hover:scale-110"
                    style={{ background: 'rgba(159,110,255,0.1)', color: '#9F6EFF', border: '1px solid rgba(159,110,255,0.2)' }}
                  >
                    <VolumeIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#F0F9FF', color: '#0891B2', border: '1px solid #BAE6FD' }}>
                    {med.frequencyCode || med.frequency}
                  </span>
                  {med.durationDays && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                      {med.durationDays} days
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: med.slot === 'morning' ? '#FFFBEB' : med.slot === 'afternoon' ? '#FFF7ED' : med.slot === 'night' ? '#F0F9FF' : '#F8FAFC',
                      color: med.slot === 'morning' ? '#D97706' : med.slot === 'afternoon' ? '#EA580C' : med.slot === 'night' ? '#0891B2' : '#64748B',
                      border: '1px solid #E2E8F0',
                    }}>
                    {med.slot}
                  </span>
                </div>
                {med.instructions && (
                  <p className="text-xs mt-1" style={{ color: '#64748B' }}>{med.instructions}</p>
                )}
              </div>
              {med.status !== 'expired' && (
                <button
                  onClick={() => setDispensingMed(dispensingMed?.name === med.name ? null : med)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-xl font-semibold"
                  style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }}
                >
                  Dispense
                </button>
              )}
            </div>

            {dispensingMed?.name === med.name && (
              <div className="mt-3">
                <DispenserBridge
                  compartment={med.compartment || 1}
                  drug={med.name}
                  dose={med.dosage}
                  addToast={addToast}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {prescription.notes && (
        <div className="rounded-2xl p-4 text-sm" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <span className="font-semibold" style={{ color: '#D97706' }}>{tps.notes}: </span>
          <span style={{ color: '#334155' }}>{prescription.notes}</span>
        </div>
      )}
    </div>
  )
}
