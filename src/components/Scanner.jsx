// src/components/Scanner.jsx — dark glass
import { useState, useRef, useCallback } from 'react'
import { analyzeMedication } from '../utils/claudeApi.js'
import { CameraIcon, UploadIcon, PillIcon, RefreshIcon, XIcon, LightbulbIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

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
        style={{ background: 'rgba(10,22,34,0.85)', border: '1px solid rgba(0,232,123,0.15)', backdropFilter: 'blur(20px)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,232,123,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,232,123,0.03) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div className="scan-line" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full pulse-live" style={{ background: '#00E87B' }} />
            <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: '#00E87B' }}>
              {ts.badge}
            </span>
          </div>
          <h2 className="text-3xl font-black mb-1" style={{ color: 'var(--t1)' }}>{ts.title}</h2>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>{ts.subtitle}</p>
        </div>
      </div>

      {/* Method selector */}
      <div
        className="flex rounded-2xl p-1.5 gap-1.5"
        style={{ background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.08)' }}
      >
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
                ? { background: 'rgba(0,232,123,0.1)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.25)', boxShadow: '0 0 12px rgba(0,232,123,0.08)' }
                : { color: 'var(--t3)', border: '1px solid transparent' }
            }
          >
            <m.Icon className="w-4 h-4" />{m.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {mode === 'loading' && (
        <div className="rounded-2xl p-14 text-center" style={{ background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.1)' }}>
          <div className="flex justify-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full dot-1" style={{ background: '#00E87B', boxShadow: '0 0 10px #00E87B' }} />
            <div className="w-4 h-4 rounded-full dot-2" style={{ background: '#00C864', boxShadow: '0 0 10px #00C864' }} />
            <div className="w-4 h-4 rounded-full dot-3" style={{ background: '#00E87B', boxShadow: '0 0 10px #00E87B' }} />
          </div>
          <p className="font-bold text-lg" style={{ color: 'var(--t1)' }}>{ts.loading}</p>
          <p className="text-sm mt-2" style={{ color: 'var(--t3)' }}>{ts.loadingDesc}</p>
        </div>
      )}

      {/* Error */}
      {mode === 'error' && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,77,106,0.07)', border: '1px solid rgba(255,77,106,0.22)' }}>
          <div className="font-semibold mb-1" style={{ color: '#FF4D6A' }}>{ts.failed}</div>
          <div className="text-sm" style={{ color: 'var(--t2)' }}>{errorMsg}</div>
          <button onClick={reset} className="mt-3 text-sm font-semibold underline" style={{ color: '#FF4D6A' }}>
            {ts.tryAgain}
          </button>
        </div>
      )}

      {/* Camera UI */}
      {scanMethod === 'camera' && mode !== 'loading' && mode !== 'error' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.1)' }}>
          {cameraError && (
            <div className="px-4 py-3 text-sm font-medium border-b"
              style={{ background: 'rgba(255,173,0,0.08)', color: '#FFAD00', borderColor: 'rgba(255,173,0,0.2)' }}>
              Camera access denied — use Upload below instead.
            </div>
          )}

          {mode === 'camera' ? (
            <div>
              <div className="relative" style={{ background: '#000' }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-2/3 rounded-2xl" style={{ border: '2px solid rgba(0,232,123,0.6)', boxShadow: '0 0 20px rgba(0,232,123,0.15) inset' }} />
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center text-xs py-1"
                  style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(0,232,123,0.8)' }}>
                  {ts.holdSteady}
                </div>
              </div>
              <div className="flex gap-3 p-4">
                <button
                  onClick={handleCapture}
                  className="flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#00C864,#00E87B)', color: '#04100A', boxShadow: '0 4px 20px rgba(0,232,123,0.25)' }}
                >
                  <CameraIcon className="w-5 h-5" /> {ts.capture}
                </button>
                <button onClick={flipCamera} className="px-4 py-3 rounded-2xl transition-all"
                  style={{ background: 'rgba(0,232,123,0.07)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.15)' }}>
                  <RefreshIcon className="w-5 h-5" />
                </button>
                <button onClick={() => { stopCamera(); setMode('idle') }} className="px-4 py-3 rounded-2xl transition-all"
                  style={{ background: 'rgba(255,77,106,0.08)', color: '#FF4D6A', border: '1px solid rgba(255,77,106,0.2)' }}>
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <button
                onClick={startCamera}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#00C864,#00E87B)', color: '#04100A', boxShadow: '0 4px 20px rgba(0,232,123,0.25)' }}
              >
                <CameraIcon className="w-6 h-6" /> {ts.startCamera}
              </button>

              <div
                className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                style={{ borderColor: 'rgba(0,232,123,0.15)', color: 'var(--t3)' }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,232,123,0.35)'; e.currentTarget.style.background = 'rgba(0,232,123,0.02)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,232,123,0.15)'; e.currentTarget.style.background = 'transparent' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload({ target: { files: [f] } }) }}
              >
                <PillIcon className="w-10 h-10 mx-auto mb-2" style={{ color: 'rgba(0,232,123,0.25)' }} />
                <p className="font-medium" style={{ color: 'var(--t3)' }}>{ts.dropHere}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--t4)' }}>JPG, PNG, HEIC supported</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          )}
        </div>
      )}

      {/* Upload UI */}
      {scanMethod === 'upload' && mode !== 'loading' && mode !== 'error' && (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.1)' }}>
          <div
            className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all"
            style={{ borderColor: 'rgba(0,232,123,0.15)' }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,232,123,0.35)'; e.currentTarget.style.background = 'rgba(0,232,123,0.02)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,232,123,0.15)'; e.currentTarget.style.background = 'transparent' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload({ target: { files: [f] } }) }}
          >
            <UploadIcon className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(0,232,123,0.3)' }} />
            <p className="font-bold text-lg" style={{ color: 'var(--t1)' }}>{ts.dropHere}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{ts.dropSub}</p>
            <p className="text-xs mt-2" style={{ color: 'var(--t4)' }}>{ts.formats}</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#00C864,#00E87B)', color: '#04100A', boxShadow: '0 4px 20px rgba(0,232,123,0.2)' }}
          >
            <UploadIcon className="w-5 h-5" /> {ts.chooseFile}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>
      )}

      {/* Info banner */}
      {mode === 'idle' && (
        <div className="rounded-2xl p-4 flex gap-3" style={{ background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.15)' }}>
          <LightbulbIcon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#00C8FF' }} />
          <div className="text-sm" style={{ color: 'var(--t2)' }}>
            <span className="font-semibold" style={{ color: '#00C8FF' }}>{ts.tip}</span> {ts.tipText}
          </div>
        </div>
      )}
    </div>
  )
}
