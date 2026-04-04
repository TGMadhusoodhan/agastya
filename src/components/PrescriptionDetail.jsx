import { useState } from 'react'
import { deletePrescription, removeMedicationFromDispenser } from '../utils/prescriptionDB.js'
import DispenserBridge from './DispenserBridge.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

function daysRemaining(expiryDate) {
  if (!expiryDate) return null
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
}

function MedStatusBadge({ med, tp, ts }) {
  const days = med.expiryDate ? daysRemaining(med.expiryDate) : null

  if (med.status === 'expired' || (days !== null && days <= 0)) {
    return (
      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full line-through">
        {tp.expired_label}
      </span>
    )
  }
  if (days !== null) {
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        days <= 3 ? 'bg-red-100 text-red-600' : days <= 7 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
      }`}>
        {ts.daysLeft(days)}
      </span>
    )
  }
  return (
    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
      {tp.permanent}
    </span>
  )
}

export default function PrescriptionDetail({ prescription, onBack, onMedicationsChanged, addToast }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [dispensingMed, setDispensingMed] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const t  = useT()
  const tc = t.common
  const tp = t.prescriptions
  const tps = t.prescriptionScanner

  if (!prescription) return null

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
    } finally {
      setDeleting(false)
    }
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

  return (
    <div className="space-y-4">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#1E3A5F] font-semibold text-sm hover:text-sky-600 transition-all"
        >
          {tc.back}
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#1E3A5F]">{prescription.clinicName}</h2>
            <p className="text-[#6B7280] text-sm">{prescription.doctorName}</p>
            {prescription.doctorPhone && (
              <p className="text-xs text-[#9CA3AF]">{prescription.doctorPhone}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-[#6B7280]">
              {new Date(prescription.date).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </div>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
              prescription.status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {prescription.status === 'active' ? tp.active_label : tp.expired_label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-[#9CA3AF]">{tps.patient}</div>
            <div className="font-semibold text-sm">{prescription.patientName}</div>
            <div className="text-xs text-[#6B7280]">{prescription.patientAge} yrs, {prescription.patientSex}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 col-span-2 sm:col-span-2">
            <div className="text-xs text-[#9CA3AF]">{tps.diagnosis}</div>
            <div className="font-semibold text-sm">{prescription.diagnosis}</div>
          </div>
        </div>

        {/* Vitals */}
        {prescription.vitals && Object.values(prescription.vitals).some(Boolean) && (
          <div className="bg-sky-50 rounded-xl p-3 mb-4">
            <div className="text-xs font-semibold text-sky-600 mb-2">{tps.visitVitals}</div>
            <div className="flex flex-wrap gap-3">
              {prescription.vitals.bp && (
                <div className="text-center">
                  <div className="text-xs text-[#6B7280]">BP</div>
                  <div className="font-semibold text-sm">{prescription.vitals.bp}</div>
                </div>
              )}
              {prescription.vitals.hr && (
                <div className="text-center">
                  <div className="text-xs text-[#6B7280]">HR</div>
                  <div className="font-semibold text-sm">{prescription.vitals.hr} bpm</div>
                </div>
              )}
              {prescription.vitals.spo2 && (
                <div className="text-center">
                  <div className="text-xs text-[#6B7280]">SpO2</div>
                  <div className="font-semibold text-sm">{prescription.vitals.spo2}%</div>
                </div>
              )}
              {prescription.vitals.temp && (
                <div className="text-center">
                  <div className="text-xs text-[#6B7280]">Temp</div>
                  <div className="font-semibold text-sm">{prescription.vitals.temp}°F</div>
                </div>
              )}
              {prescription.vitals.weight && (
                <div className="text-center">
                  <div className="text-xs text-[#6B7280]">Weight</div>
                  <div className="font-semibold text-sm">{prescription.vitals.weight}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 border-2 border-[#1E3A5F] text-[#1E3A5F] py-2 rounded-xl font-semibold text-sm hover:bg-[#1E3A5F] hover:text-white transition-all"
          >
            {tc.share}
          </button>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border-2 border-red-200 text-red-500 rounded-xl font-semibold text-sm hover:bg-red-50 transition-all"
            >
              {tc.delete}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all"
              >
                {deleting ? '...' : tc.confirm}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border-2 border-gray-200 text-gray-500 rounded-xl font-semibold text-sm"
              >
                {tc.cancel}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Prescription image (if stored) */}
      {prescription.imageBlob && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">{tps.review}</div>
          <img
            src={URL.createObjectURL(prescription.imageBlob)}
            alt="Original prescription"
            className="w-full rounded-xl border border-gray-100"
          />
        </div>
      )}

      {/* Medications */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
          {tps.medications} ({prescription.medications?.length || 0})
        </div>
        <div className="space-y-3">
          {(prescription.medications || []).map((med, idx) => (
            <div key={idx} className={`border-2 rounded-xl p-4 ${
              med.status === 'expired' ? 'border-gray-100 bg-gray-50 opacity-70' : 'border-gray-100'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-[#1E3A5F]">{med.name}</span>
                    {med.dosage && <span className="text-sm text-[#6B7280]">{med.dosage}</span>}
                    <MedStatusBadge med={med} tp={tp} ts={t.schedule} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                      {med.frequencyCode || med.frequency}
                    </span>
                    {med.durationDays && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {med.durationDays} days
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      med.slot === 'morning' ? 'bg-yellow-100 text-yellow-700' :
                      med.slot === 'afternoon' ? 'bg-orange-100 text-orange-700' :
                      med.slot === 'night' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {med.slot}
                    </span>
                  </div>
                  {med.instructions && (
                    <p className="text-xs text-[#6B7280] mt-1">{med.instructions}</p>
                  )}
                </div>
                {med.status !== 'expired' && (
                  <button
                    onClick={() => setDispensingMed(dispensingMed?.name === med.name ? null : med)}
                    className="shrink-0 text-xs bg-[#1E3A5F] text-white px-3 py-1.5 rounded-lg hover:bg-[#152d4a] transition-all"
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
      </div>

      {prescription.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
          <span className="font-semibold">{tps.notes}: </span>{prescription.notes}
        </div>
      )}
    </div>
  )
}
