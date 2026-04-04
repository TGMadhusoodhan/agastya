import { useState, useRef, useCallback } from 'react'
import { analyzePrescription } from '../utils/claudeApi.js'
import { CameraIcon, UploadIcon, ClipboardIcon, CheckIcon, XIcon } from './Icons.jsx'

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

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#1E3A5F]">Review Extracted Prescription</h3>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
          AI Extracted
        </span>
      </div>

      {/* Clinic & Doctor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#6B7280] font-semibold">Clinic</label>
          <input
            className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
            value={edited.clinicName || ''}
            onChange={(e) => setEdited({ ...edited, clinicName: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-[#6B7280] font-semibold">Doctor</label>
          <input
            className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
            value={edited.doctorName || ''}
            onChange={(e) => setEdited({ ...edited, doctorName: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-[#6B7280] font-semibold">Patient</label>
          <input
            className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
            value={edited.patientName || ''}
            onChange={(e) => setEdited({ ...edited, patientName: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-[#6B7280] font-semibold">Diagnosis</label>
          <input
            className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
            value={edited.diagnosis || ''}
            onChange={(e) => setEdited({ ...edited, diagnosis: e.target.value })}
          />
        </div>
      </div>

      {/* Vitals */}
      {edited.vitals && Object.values(edited.vitals).some(Boolean) && (
        <div className="bg-sky-50 rounded-xl p-3">
          <div className="text-xs font-semibold text-sky-600 mb-2">Visit Vitals</div>
          <div className="flex flex-wrap gap-3 text-sm">
            {edited.vitals.bp && <span className="bg-white rounded-lg px-2 py-1 shadow-sm">BP: {edited.vitals.bp}</span>}
            {edited.vitals.hr && <span className="bg-white rounded-lg px-2 py-1 shadow-sm">HR: {edited.vitals.hr}</span>}
            {edited.vitals.spo2 && <span className="bg-white rounded-lg px-2 py-1 shadow-sm">SpO2: {edited.vitals.spo2}%</span>}
            {edited.vitals.temp && <span className="bg-white rounded-lg px-2 py-1 shadow-sm">Temp: {edited.vitals.temp}°F</span>}
            {edited.vitals.weight && <span className="bg-white rounded-lg px-2 py-1 shadow-sm">Wt: {edited.vitals.weight}</span>}
          </div>
        </div>
      )}

      {/* Medications */}
      <div>
        <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">
          Medications ({edited.medications?.length || 0})
        </div>
        <div className="space-y-3">
          {(edited.medications || []).map((med, idx) => (
            <div key={idx} className="border-2 border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#1E3A5F] text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">
                  {idx + 1}
                </div>
                <input
                  className="flex-1 border-2 rounded-xl px-3 py-1.5 text-sm font-semibold focus:border-sky-500 outline-none"
                  value={med.name || ''}
                  onChange={(e) => updateMed(idx, 'name', e.target.value)}
                  placeholder="Medication name"
                />
                <input
                  className="w-24 border-2 rounded-xl px-3 py-1.5 text-sm focus:border-sky-500 outline-none"
                  value={med.dosage || ''}
                  onChange={(e) => updateMed(idx, 'dosage', e.target.value)}
                  placeholder="Dosage"
                />
              </div>
              <div className="flex gap-2 ml-8">
                <div className="flex gap-1 items-center text-xs text-[#6B7280]">
                  <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium">
                    {med.frequencyCode || med.frequency}
                  </span>
                  {med.durationDays && (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {med.durationDays} days
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    med.slot === 'morning' ? 'bg-yellow-100 text-yellow-700' :
                    med.slot === 'afternoon' ? 'bg-orange-100 text-orange-700' :
                    med.slot === 'night' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {med.slot}
                  </span>
                  <span className="bg-[#1E3A5F]/10 text-[#1E3A5F] px-2 py-0.5 rounded-full font-medium">
                    Compartment {med.compartment}
                  </span>
                </div>
              </div>
              {med.expiryDate && (
                <div className="ml-8 text-xs text-emerald-600">
                  Auto-expires: {med.expiryDate}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {edited.notes && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm text-[#6B7280]">
          <span className="font-semibold">Notes: </span>{edited.notes}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onConfirm(edited)}
          className="flex-1 bg-[#1E3A5F] text-white py-3 rounded-xl font-bold hover:bg-[#152d4a] transition-all flex items-center justify-center gap-2"
        >
          <CheckIcon className="w-4 h-4" /> Confirm & Save to Library
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 border-2 border-gray-200 text-[#6B7280] rounded-xl font-semibold hover:border-red-300 hover:text-red-500 transition-all flex items-center gap-1"
        >
          <XIcon className="w-4 h-4" /> Discard
        </button>
      </div>
    </div>
  )
}

export default function PrescriptionScanner({ onSaved, addToast }) {
  const [mode, setMode] = useState('idle') // idle | camera | loading | review | error
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setMode('camera')
    } catch {
      setCameraError(true)
    }
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

    // Convert to blob for storage
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
      // Show the real error so we can debug it
      const msg = err?.message || 'Unknown error'
      addToast(`Scan failed: ${msg}`, 'error', 8000)
    }
  }

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'
      const base64 = dataUrl.split(',')[1]
      setCapturedImage(dataUrl)
      setCapturedBlob(file)
      await runAnalysis(base64, mediaType)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleConfirm = useCallback((data) => {
    onSaved(data, capturedBlob)
  }, [onSaved, capturedBlob])

  const reset = () => {
    stopCamera()
    setMode('idle')
    setExtractedData(null)
    setCapturedImage(null)
    setCapturedBlob(null)
  }

  return (
    <div className="space-y-4">
      {mode !== 'review' && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#1E3A5F] mb-2">Scan Prescription Slip</h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Supports handwritten Indian clinic prescriptions — mixed Kannada, Hindi, Tamil and English
          </p>

          {mode === 'camera' ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-80 object-cover"
                />
                <div className="absolute inset-0 border-2 border-amber-400 rounded-xl pointer-events-none opacity-70" />
                <div className="absolute bottom-3 left-0 right-0 text-center text-white text-xs bg-black/40 py-1">
                  Hold prescription flat and steady
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={capture}
                  className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                >
                  <CameraIcon className="w-5 h-5" /> Scan Prescription
                </button>
                <button
                  onClick={() => { stopCamera(); setMode('idle') }}
                  className="px-4 py-3 border-2 border-red-300 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-all"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : mode === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full dot-1" />
                <div className="w-3 h-3 bg-amber-500 rounded-full dot-2" />
                <div className="w-3 h-3 bg-amber-500 rounded-full dot-3" />
              </div>
              <p className="text-[#6B7280] font-medium text-center">
                Agastya is reading your prescription...
              </p>
              <p className="text-xs text-[#9CA3AF] text-center">
                Decoding handwriting, medications, and dosages
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mode === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm space-y-1">
                  <div className="font-semibold">Scan failed — check browser console for details</div>
                  <div className="text-xs text-red-600">
                    Common causes: API key not set in .env · Network error · Image too large
                  </div>
                </div>
              )}
              {cameraError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-sm">
                  Camera access denied — please upload a photo instead.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={startCamera}
                  className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                >
                  <CameraIcon className="w-5 h-5" /> Camera
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 border-2 border-amber-500 text-amber-600 py-3 rounded-xl font-semibold hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                >
                  <UploadIcon className="w-5 h-5" /> Upload Photo
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              <div
                className="border-2 border-dashed border-amber-200 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) handleFileUpload({ target: { files: [file] } })
                }}
              >
                <div className="flex justify-center mb-2"><ClipboardIcon className="w-8 h-8 text-amber-400" /></div>
                <p className="text-amber-600 font-medium text-sm">Drop prescription photo here</p>
                <p className="text-[#9CA3AF] text-xs mt-1">JPG, PNG, HEIC supported</p>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'review' && extractedData && (
        <ReviewCard
          data={extractedData}
          onConfirm={handleConfirm}
          onCancel={reset}
        />
      )}
    </div>
  )
}
