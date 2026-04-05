// src/components/PrescriptionDetail.jsx — dark glass
import { useState, useEffect } from 'react'
import { deletePrescription } from '../utils/prescriptionDB.js'
import DispenserBridge from './DispenserBridge.jsx'
import { useT, useLang } from '../contexts/LanguageContext.jsx'
import { translateNames } from '../utils/claudeApi.js'

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function MedStatusBadge({ med, tp, ts }) {
  const days = med.expiryDate ? daysRemaining(med.expiryDate) : null

  if (med.status === 'expired' || (days !== null && days <= 0)) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full line-through"
        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--t3)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {tp.expired_label}
      </span>
    )
  }
  if (days !== null) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
        style={
          days <= 3
            ? { background: 'rgba(255,77,106,0.1)', color: '#FF4D6A', border: '1px solid rgba(255,77,106,0.2)' }
            : days <= 7
            ? { background: 'rgba(255,173,0,0.1)', color: '#FFAD00', border: '1px solid rgba(255,173,0,0.2)' }
            : { background: 'rgba(0,232,123,0.1)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.2)' }
        }>
        {ts.daysLeft(days)}
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--t3)', border: '1px solid rgba(255,255,255,0.08)' }}>
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

  const cardStyle = { background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.1)', backdropFilter: 'blur(20px)', borderRadius: '1.5rem', padding: '1.5rem' }

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold transition-all"
        style={{ color: '#00E87B' }}
      >
        ← {tc.back}
      </button>

      {/* Header card */}
      <div style={cardStyle} className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black" style={{ color: 'var(--t1)' }}>{tx(prescription.clinicName)}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--t3)' }}>{tx(prescription.doctorName)}</p>
            {prescription.doctorPhone && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--t4)' }}>{prescription.doctorPhone}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm" style={{ color: 'var(--t3)' }}>
              {new Date(prescription.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold"
              style={
                prescription.status === 'active'
                  ? { background: 'rgba(0,232,123,0.1)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.2)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'var(--t3)', border: '1px solid rgba(255,255,255,0.08)' }
              }>
              {prescription.status === 'active' ? tp.active_label : tp.expired_label}
            </span>
          </div>
        </div>

        {/* Patient / Diagnosis info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl p-3" style={{ background: 'rgba(0,232,123,0.04)', border: '1px solid rgba(0,232,123,0.08)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--t3)' }}>{tps.patient}</div>
            <div className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{prescription.patientName}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>{prescription.patientAge} yrs, {prescription.patientSex}</div>
          </div>
          <div className="rounded-2xl p-3 col-span-1 sm:col-span-2" style={{ background: 'rgba(0,232,123,0.04)', border: '1px solid rgba(0,232,123,0.08)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--t3)' }}>{tps.diagnosis}</div>
            <div className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{prescription.diagnosis}</div>
          </div>
        </div>

        {/* Vitals */}
        {prescription.vitals && Object.values(prescription.vitals).some(Boolean) && (
          <div className="rounded-2xl p-3" style={{ background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)' }}>
            <div className="text-xs font-bold mb-2" style={{ color: '#00C8FF' }}>{tps.visitVitals}</div>
            <div className="flex flex-wrap gap-4">
              {prescription.vitals.bp     && <div className="text-center"><div className="text-xs" style={{ color: 'var(--t3)' }}>BP</div><div className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{prescription.vitals.bp}</div></div>}
              {prescription.vitals.hr     && <div className="text-center"><div className="text-xs" style={{ color: 'var(--t3)' }}>HR</div><div className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{prescription.vitals.hr} bpm</div></div>}
              {prescription.vitals.spo2   && <div className="text-center"><div className="text-xs" style={{ color: 'var(--t3)' }}>SpO2</div><div className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{prescription.vitals.spo2}%</div></div>}
              {prescription.vitals.temp   && <div className="text-center"><div className="text-xs" style={{ color: 'var(--t3)' }}>Temp</div><div className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{prescription.vitals.temp}°F</div></div>}
              {prescription.vitals.weight && <div className="text-center"><div className="text-xs" style={{ color: 'var(--t3)' }}>Weight</div><div className="font-bold text-sm" style={{ color: 'var(--t1)' }}>{prescription.vitals.weight}</div></div>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 py-2 rounded-2xl font-semibold text-sm transition-all"
            style={{ background: 'rgba(0,232,123,0.08)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.2)' }}
          >
            {tc.share}
          </button>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-2xl font-semibold text-sm transition-all"
              style={{ background: 'rgba(255,77,106,0.08)', color: '#FF4D6A', border: '1px solid rgba(255,77,106,0.2)' }}
            >
              {tc.delete}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-2xl font-semibold text-sm"
                style={{ background: 'rgba(255,77,106,0.2)', color: '#FF4D6A', border: '1px solid rgba(255,77,106,0.3)' }}
              >
                {deleting ? '…' : tc.confirm}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-2xl font-semibold text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--t3)', border: '1px solid rgba(255,255,255,0.08)' }}
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
          <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--t3)' }}>{tps.review}</div>
          <img
            src={URL.createObjectURL(prescription.imageBlob)}
            alt="Original prescription"
            className="w-full rounded-2xl"
            style={{ border: '1px solid rgba(0,232,123,0.1)' }}
          />
        </div>
      )}

      {/* Medications */}
      <div style={cardStyle} className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--t3)' }}>
          {tps.medications} ({prescription.medications?.length || 0})
        </div>
        {(prescription.medications || []).map((med, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-4"
            style={{
              background: med.status === 'expired' ? 'rgba(255,255,255,0.02)' : 'rgba(0,232,123,0.04)',
              border: '1px solid rgba(0,232,123,0.1)',
              opacity: med.status === 'expired' ? 0.6 : 1,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold" style={{ color: 'var(--t1)' }}>{tx(med.name)}</span>
                  {med.dosage && <span className="text-sm" style={{ color: 'var(--t3)' }}>{med.dosage}</span>}
                  <MedStatusBadge med={med} tp={tp} ts={t.schedule} />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,200,255,0.1)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.15)' }}>
                    {med.frequencyCode || med.frequency}
                  </span>
                  {med.durationDays && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,173,0,0.1)', color: '#FFAD00', border: '1px solid rgba(255,173,0,0.15)' }}>
                      {med.durationDays} days
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: med.slot === 'morning' ? 'rgba(255,184,0,0.1)' : med.slot === 'afternoon' ? 'rgba(255,107,53,0.1)' : med.slot === 'night' ? 'rgba(0,200,255,0.1)' : 'rgba(255,255,255,0.05)',
                      color: med.slot === 'morning' ? '#FFB800' : med.slot === 'afternoon' ? '#FF6B35' : med.slot === 'night' ? '#00C8FF' : 'var(--t3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {med.slot}
                  </span>
                </div>
                {med.instructions && (
                  <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>{med.instructions}</p>
                )}
              </div>
              {med.status !== 'expired' && (
                <button
                  onClick={() => setDispensingMed(dispensingMed?.name === med.name ? null : med)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-xl font-semibold"
                  style={{ background: 'rgba(0,232,123,0.1)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.2)' }}
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
        <div className="rounded-2xl p-4 text-sm" style={{ background: 'rgba(255,173,0,0.06)', border: '1px solid rgba(255,173,0,0.15)' }}>
          <span className="font-semibold" style={{ color: '#FFAD00' }}>{tps.notes}: </span>
          <span style={{ color: 'var(--t2)' }}>{prescription.notes}</span>
        </div>
      )}
    </div>
  )
}
