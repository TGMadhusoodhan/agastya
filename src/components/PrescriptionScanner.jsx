// src/components/PrescriptionScanner.jsx — dark glass
import { useState, useRef, useCallback } from 'react'
import { analyzePrescription } from '../utils/claudeApi.js'
import { CameraIcon, UploadIcon, ClipboardIcon, CheckIcon, XIcon } from './Icons.jsx'

const inputStyle = {
  background: 'rgba(10,22,34,0.7)',
  border: '1px solid rgba(0,232,123,0.12)',
  color: '#EDFAF3',
  borderRadius: '0.875rem',
  padding: '0.5rem 0.75rem',
  width: '100%',
  fontSize: '0.875rem',
  outline: 'none',
}

function ReviewCard({ data, onConfirm, onCancel }) {
  const [edited, setEdited] = useState(data)

  const updateMed = (idx, field, value) => {
    setEdited((prev) => ({
      ...prev,
      medications: prev.medications.map((m, i) =>
        i === idx ? { ...m, [field]: value } : m
      ),
    }))
  }

  const cardStyle = { background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.12)', backdropFilter: 'blur(20px)', borderRadius: '1.5rem', padding: '1.5rem' }

  return (
    <div style={cardStyle} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black" style={{ color: 'var(--t1)' }}>Review Extracted Prescription</h3>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(0,232,123,0.1)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.2)' }}>
          AI Extracted
        </span>
      </div>

      {/* Clinic & Doctor */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Clinic',    key: 'clinicName'   },
          { label: 'Doctor',    key: 'doctorName'   },
          { label: 'Patient',   key: 'patientName'  },
          { label: 'Diagnosis', key: 'diagnosis'    },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--t3)' }}>{label}</label>
            <input
              style={inputStyle}
              value={edited[key] || ''}
              onChange={(e) => setEdited({ ...edited, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      {/* Vitals */}
      {edited.vitals && Object.values(edited.vitals).some(Boolean) && (
        <div className="rounded-2xl p-3" style={{ background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)' }}>
          <div className="text-xs font-bold mb-2" style={{ color: '#00C8FF' }}>Visit Vitals</div>
          <div className="flex flex-wrap gap-2 text-sm">
            {edited.vitals.bp     && <span className="px-2 py-1 rounded-xl text-xs font-semibold" style={{ background: 'rgba(0,200,255,0.1)', color: '#00C8FF' }}>BP: {edited.vitals.bp}</span>}
            {edited.vitals.hr     && <span className="px-2 py-1 rounded-xl text-xs font-semibold" style={{ background: 'rgba(255,77,106,0.1)', color: '#FF4D6A' }}>HR: {edited.vitals.hr}</span>}
            {edited.vitals.spo2   && <span className="px-2 py-1 rounded-xl text-xs font-semibold" style={{ background: 'rgba(0,232,123,0.1)', color: '#00E87B' }}>SpO2: {edited.vitals.spo2}%</span>}
            {edited.vitals.temp   && <span className="px-2 py-1 rounded-xl text-xs font-semibold" style={{ background: 'rgba(255,173,0,0.1)', color: '#FFAD00' }}>Temp: {edited.vitals.temp}°F</span>}
            {edited.vitals.weight && <span className="px-2 py-1 rounded-xl text-xs font-semibold" style={{ background: 'rgba(159,110,255,0.1)', color: '#9F6EFF' }}>Wt: {edited.vitals.weight}</span>}
          </div>
        </div>
      )}

      {/* Medications */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--t3)' }}>
          Medications ({edited.medications?.length || 0})
        </div>
        <div className="space-y-3">
          {(edited.medications || []).map((med, idx) => (
            <div key={idx} className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(0,232,123,0.04)', border: '1px solid rgba(0,232,123,0.1)' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: 'rgba(0,232,123,0.15)', color: '#00E87B' }}>
                  {idx + 1}
                </div>
                <input
                  style={{ ...inputStyle, flex: 1, fontWeight: 700 }}
                  value={med.name || ''}
                  onChange={(e) => updateMed(idx, 'name', e.target.value)}
                  placeholder="Medication name"
                />
                <input
                  style={{ ...inputStyle, width: '6rem' }}
                  value={med.dosage || ''}
                  onChange={(e) => updateMed(idx, 'dosage', e.target.value)}
                  placeholder="Dosage"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap ml-9">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(0,200,255,0.1)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.2)' }}>
                  {med.frequencyCode || med.frequency}
                </span>
                {med.durationDays && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(255,173,0,0.1)', color: '#FFAD00', border: '1px solid rgba(255,173,0,0.2)' }}>
                    {med.durationDays} days
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: med.slot === 'morning' ? 'rgba(255,184,0,0.1)' : med.slot === 'afternoon' ? 'rgba(255,107,53,0.1)' : med.slot === 'night' ? 'rgba(0,200,255,0.1)' : 'rgba(255,255,255,0.05)',
                    color: med.slot === 'morning' ? '#FFB800' : med.slot === 'afternoon' ? '#FF6B35' : med.slot === 'night' ? '#00C8FF' : 'var(--t3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                  {med.slot}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(0,232,123,0.08)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.15)' }}>
                  Compartment {med.compartment}
                </span>
              </div>
              {med.expiryDate && (
                <div className="ml-9 text-xs" style={{ color: '#00E87B' }}>Auto-expires: {med.expiryDate}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {edited.notes && (
        <div className="rounded-2xl p-3 text-sm" style={{ background: 'rgba(255,173,0,0.06)', border: '1px solid rgba(255,173,0,0.15)', color: '#FFAD00' }}>
          <span className="font-semibold">Notes: </span>
          <span style={{ color: 'var(--t2)' }}>{edited.notes}</span>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={() => onConfirm(edited)}
          className="flex-1 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#00C864,#00E87B)', color: '#04100A', boxShadow: '0 4px 20px rgba(0,232,123,0.25)' }}
        >
          <CheckIcon className="w-4 h-4" /> Confirm & Save
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-1.5"
          style={{ background: 'rgba(255,77,106,0.08)', color: '#FF4D6A', border: '1px solid rgba(255,77,106,0.2)' }}
        >
          <XIcon className="w-4 h-4" /> Discard
        </button>
      </div>
    </div>
  )
}

export default function PrescriptionScanner({ onSaved, addToast }) {
  const [mode, setMode] = useState('idle')
  const [capturedImage, setCapturedImage] = useState(null)
  const [capturedBlob, setCapturedBlob] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [facing, setFacing] = useState('environment')
  const [cameraError, setCameraError] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setMode('camera')
    } catch { setCameraError(true) }
  }, [facing])

  const capture = useCallback(async () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const base64 = dataUrl.split(',')[1]
    stopCamera()
    canvas.toBlob((blob) => setCapturedBlob(blob), 'image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    await runAnalysis(base64)
  }, [stopCamera])

  async function runAnalysis(base64, mediaType = 'image/jpeg') {
    setMode('loading')
    try {
      const data = await analyzePrescription(base64, mediaType)
      setExtractedData(data)
      setMode('review')
    } catch (err) {
      console.error('analyzePrescription error:', err)
      setMode('error')
      addToast(`Scan failed: ${err?.message || 'Unknown error'}`, 'error', 8000)
    }
  }

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl  = ev.target.result
      const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'
      const base64   = dataUrl.split(',')[1]
      setCapturedImage(dataUrl)
      setCapturedBlob(file)
      await runAnalysis(base64, mediaType)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleConfirm = useCallback((data) => onSaved(data, capturedBlob), [onSaved, capturedBlob])

  const reset = () => {
    stopCamera()
    setMode('idle')
    setExtractedData(null)
    setCapturedImage(null)
    setCapturedBlob(null)
  }

  const cardStyle = { background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.1)', backdropFilter: 'blur(20px)', borderRadius: '1.5rem', padding: '1.5rem' }

  return (
    <div className="space-y-4">
      {mode !== 'review' && (
        <div style={cardStyle} className="space-y-5">
          {/* Header */}
          <div>
            <h2 className="text-xl font-black" style={{ color: 'var(--t1)' }}>Scan Prescription Slip</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
              Supports handwritten Indian clinic prescriptions — mixed Kannada, Hindi, Tamil and English
            </p>
          </div>

          {/* Loading */}
          {mode === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full dot-1" style={{ background: '#00E87B', boxShadow: '0 0 8px #00E87B' }} />
                <div className="w-3 h-3 rounded-full dot-2" style={{ background: '#00C864', boxShadow: '0 0 8px #00C864' }} />
                <div className="w-3 h-3 rounded-full dot-3" style={{ background: '#00E87B', boxShadow: '0 0 8px #00E87B' }} />
              </div>
              <p className="font-bold" style={{ color: 'var(--t1)' }}>Agastya is reading your prescription…</p>
              <p className="text-xs text-center" style={{ color: 'var(--t3)' }}>Decoding handwriting, medications, and dosages</p>
            </div>
          )}

          {/* Camera live */}
          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden" style={{ background: '#000' }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-80 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-2/3 rounded-2xl" style={{ border: '2px solid rgba(0,232,123,0.6)', boxShadow: '0 0 20px rgba(0,232,123,0.15) inset' }} />
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center text-xs py-1" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(0,232,123,0.8)' }}>
                  Hold prescription flat and steady
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={capture}
                  className="flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#00C864,#00E87B)', color: '#04100A', boxShadow: '0 4px 20px rgba(0,232,123,0.25)' }}
                >
                  <CameraIcon className="w-5 h-5" /> Scan Prescription
                </button>
                <button
                  onClick={() => { stopCamera(); setMode('idle') }}
                  className="px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(255,77,106,0.1)', color: '#FF4D6A', border: '1px solid rgba(255,77,106,0.2)' }}
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Idle / error */}
          {(mode === 'idle' || mode === 'error') && (
            <div className="space-y-4">
              {mode === 'error' && (
                <div className="rounded-2xl p-3 text-sm" style={{ background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)' }}>
                  <div className="font-semibold" style={{ color: '#FF4D6A' }}>Scan failed — check browser console for details</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>Common causes: API key not set · Network error · Image too large</div>
                </div>
              )}
              {cameraError && (
                <div className="rounded-2xl p-3 text-sm" style={{ background: 'rgba(255,173,0,0.08)', border: '1px solid rgba(255,173,0,0.2)', color: '#FFAD00' }}>
                  Camera access denied — please upload a photo instead.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={startCamera}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#00C864,#00E87B)', color: '#04100A', boxShadow: '0 4px 16px rgba(0,232,123,0.2)' }}
                >
                  <CameraIcon className="w-5 h-5" /> Camera
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'rgba(0,232,123,0.08)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.2)' }}
                >
                  <UploadIcon className="w-5 h-5" /> Upload Photo
                </button>
              </div>

              <div
                className="rounded-2xl p-10 text-center cursor-pointer transition-all"
                style={{ border: '2px dashed rgba(0,232,123,0.15)' }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,232,123,0.35)'; e.currentTarget.style.background = 'rgba(0,232,123,0.02)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,232,123,0.15)'; e.currentTarget.style.background = 'transparent' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFileUpload({ target: { files: [file] } }) }}
              >
                <ClipboardIcon className="w-10 h-10 mx-auto mb-2" style={{ color: 'rgba(0,232,123,0.3)' }} />
                <p className="font-semibold text-sm" style={{ color: '#00E87B' }}>Drop prescription photo here</p>
                <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>JPG, PNG, HEIC supported</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          )}
        </div>
      )}

      {mode === 'review' && extractedData && (
        <ReviewCard data={extractedData} onConfirm={handleConfirm} onCancel={reset} />
      )}
    </div>
  )
}
