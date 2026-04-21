// src/components/Scanner.jsx
import { useState, useRef, useCallback } from 'react'
import { analyzeMedication } from '../utils/claudeApi.js'
import { CameraIcon, UploadIcon, PillIcon, RefreshIcon, XIcon, LightbulbIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

const CARD = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
}

export default function Scanner({ patient, onResult }) {
  const t  = useT()
  const ts = t.scanner
  const [mode, setMode] = useState('idle')
  const [scanMethod, setScanMethod] = useState('camera')
  const [facing, setFacing] = useState('environment')
  const [cameraError, setCameraError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const fileRef   = useRef(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(false)
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setMode('camera')
    } catch {
      setCameraError(true)
      setScanMethod('upload')
    }
  }, [facing])

  const flipCamera = useCallback(() => {
    stopCamera()
    setFacing(f => f === 'environment' ? 'user' : 'environment')
    setTimeout(startCamera, 200)
  }, [stopCamera, startCamera])

  const runAnalysis = useCallback(async (base64, mediaType = 'image/jpeg') => {
    stopCamera()
    setMode('loading')
    setErrorMsg('')
    try {
      const result = await analyzeMedication(base64, patient, mediaType)
      setMode('idle')
      onResult(result)
    } catch {
      setMode('error')
      setErrorMsg('Could not analyze the medication. Please try a clearer photo or use the search below.')
    }
  }, [patient, onResult, stopCamera])

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width  = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    await runAnalysis(canvas.toDataURL('image/jpeg', 0.85).split(',')[1], 'image/jpeg')
  }, [runAnalysis])

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl   = ev.target.result
      const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'
      await runAnalysis(dataUrl.split(',')[1], mediaType)
    }
    reader.readAsDataURL(file)
  }, [runAnalysis])

  const reset = () => { stopCamera(); setMode('idle'); setCameraError(false); setErrorMsg('') }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* Hero */}
      <div
        className="relative rounded-2xl p-7 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 6px 24px rgba(37,99,235,0.22)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full pulse-live" style={{ background: '#6EE7B7' }} />
            <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {ts.badge}
            </span>
          </div>
          <h2 className="text-3xl font-black mb-1" style={{ color: '#fff' }}>{ts.title}</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{ts.subtitle}</p>
        </div>
      </div>

      {/* Method selector */}
      <div className="flex rounded-2xl p-1.5 gap-1.5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        {[
          { id: 'camera', Icon: CameraIcon, label: ts.camera, desc: ts.liveCam   },
          { id: 'upload', Icon: UploadIcon,  label: ts.upload,  desc: ts.photoFile },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => { setScanMethod(m.id); if (mode === 'camera') stopCamera(); setMode('idle') }}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            style={
              scanMethod === m.id
                ? { background: '#fff', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }
                : { color: '#64748B', border: '1px solid transparent' }
            }
          >
            <m.Icon className="w-4 h-4" />{m.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {mode === 'loading' && (
        <div className="rounded-2xl p-10 text-center scale-in" style={CARD}>
          <div className="relative w-20 h-20 mx-auto mb-6">
            <svg viewBox="0 0 80 80" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="#EFF3FB" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="#2563EB" strokeWidth="6"
                strokeDasharray="36 178" strokeLinecap="round"
                className="spin-arc"
                style={{ filter: 'drop-shadow(0 0 4px rgba(37,99,235,0.5))' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <PillIcon className="w-7 h-7" style={{ color: '#2563EB' }} />
            </div>
          </div>

          <p className="font-black text-lg mb-1" style={{ color: '#0F172A' }}>{ts.loading}</p>
          <p className="text-sm mb-5" style={{ color: '#64748B' }}>{ts.loadingDesc}</p>

          <div className="mx-auto max-w-xs">
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: '#F1F5F9' }}>
              <div
                className="h-full rounded-full progress-ai"
                style={{ background: 'linear-gradient(90deg, #1D56DB, #2563EB)', boxShadow: '0 0 6px rgba(37,99,235,0.4)' }}
              />
            </div>
            <div className="text-xs" style={{ color: '#94A3B8' }}>Analyzing with AI · usually under 15s</div>
          </div>
        </div>
      )}

      {/* Error */}
      {mode === 'error' && (
        <div className="rounded-2xl p-5" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div className="font-semibold mb-1" style={{ color: '#DC2626' }}>{ts.failed}</div>
          <div className="text-sm" style={{ color: '#334155' }}>{errorMsg}</div>
          <button onClick={reset} className="mt-3 text-sm font-semibold" style={{ color: '#DC2626' }}>
            ← {ts.tryAgain}
          </button>
        </div>
      )}

      {/* Camera UI */}
      {scanMethod === 'camera' && mode !== 'loading' && mode !== 'error' && (
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          {cameraError && (
            <div className="px-4 py-3 text-sm font-medium border-b"
              style={{ background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }}>
              Camera access denied — use Upload instead.
            </div>
          )}

          {mode === 'camera' ? (
            <div>
              <div className="relative" style={{ background: '#0F172A' }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-2/3 rounded-2xl" style={{ border: '2px solid rgba(37,99,235,0.6)', boxShadow: '0 0 20px rgba(37,99,235,0.15) inset' }} />
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center text-xs py-1"
                  style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)' }}>
                  {ts.holdSteady}
                </div>
              </div>
              <div className="flex gap-3 p-4">
                <button
                  onClick={handleCapture}
                  className="flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.28)' }}
                >
                  <CameraIcon className="w-5 h-5" /> {ts.capture}
                </button>
                <button onClick={flipCamera} className="px-4 py-3 rounded-2xl transition-all"
                  style={{ background: '#F8FAFC', color: '#2563EB', border: '1px solid #E2E8F0' }}>
                  <RefreshIcon className="w-5 h-5" />
                </button>
                <button onClick={() => { stopCamera(); setMode('idle') }} className="px-4 py-3 rounded-2xl transition-all"
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <button
                onClick={startCamera}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.28)' }}
              >
                <CameraIcon className="w-6 h-6" /> {ts.startCamera}
              </button>

              <div
                className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                style={{ borderColor: '#E2E8F0', background: '#FAFAFA' }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.background = 'rgba(37,99,235,0.02)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFAFA' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload({ target: { files: [f] } }) }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: 'rgba(37,99,235,0.08)' }}>
                  <PillIcon className="w-6 h-6" style={{ color: '#2563EB' }} />
                </div>
                <p className="font-medium" style={{ color: '#334155' }}>{ts.dropHere}</p>
                <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>JPG, PNG, HEIC supported</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          )}
        </div>
      )}

      {/* Upload UI */}
      {scanMethod === 'upload' && mode !== 'loading' && mode !== 'error' && (
        <div className="rounded-2xl p-6 space-y-4" style={CARD}>
          <div
            className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all"
            style={{ borderColor: '#E2E8F0', background: '#FAFAFA' }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.background = 'rgba(37,99,235,0.02)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFAFA' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload({ target: { files: [f] } }) }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(37,99,235,0.08)' }}>
              <UploadIcon className="w-8 h-8" style={{ color: '#2563EB' }} />
            </div>
            <p className="font-bold text-lg" style={{ color: '#0F172A' }}>{ts.dropHere}</p>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>{ts.dropSub}</p>
            <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>{ts.formats}</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.28)' }}
          >
            <UploadIcon className="w-5 h-5" /> {ts.chooseFile}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>
      )}

      {/* Info banner */}
      {mode === 'idle' && (
        <div className="rounded-2xl p-4 flex gap-3" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(8,145,178,0.1)' }}>
            <LightbulbIcon className="w-4 h-4" style={{ color: '#0891B2' }} />
          </div>
          <div className="text-sm" style={{ color: '#334155' }}>
            <span className="font-semibold" style={{ color: '#0891B2' }}>{ts.tip}</span> {ts.tipText}
          </div>
        </div>
      )}
    </div>
  )
}
