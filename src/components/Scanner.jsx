// src/components/Scanner.jsx — Camera + file upload + Claude Vision
import { useState, useRef, useCallback } from 'react'
import { analyzeMedication } from '../utils/claudeApi.js'
import { CameraIcon, UploadIcon, PillIcon, RefreshIcon, XIcon, LightbulbIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

export default function Scanner({ patient, onResult }) {
  const t  = useT()
  const ts = t.scanner
  const [mode, setMode] = useState('idle') // idle | camera | loading | error
  const [scanMethod, setScanMethod] = useState('camera')
  const [facing, setFacing] = useState('environment')
  const [cameraError, setCameraError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const fileRef   = useRef(null)

  // ── Camera helpers ──────────────────────────────────────────────────
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

  // ── Analysis pipeline ───────────────────────────────────────────────
  const runAnalysis = useCallback(async (base64, mediaType = 'image/jpeg') => {
    stopCamera()
    setMode('loading')
    setErrorMsg('')
    try {
      const result = await analyzeMedication(base64, patient, mediaType)
      setMode('idle')
      onResult(result)
    } catch (err) {
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
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
    await runAnalysis(base64, 'image/jpeg')
  }, [runAnalysis])

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'
      const base64 = dataUrl.split(',')[1]
      await runAnalysis(base64, mediaType)
    }
    reader.readAsDataURL(file)
  }, [runAnalysis])

  const reset = () => {
    stopCamera()
    setMode('idle')
    setCameraError(false)
    setErrorMsg('')
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1E3A5F] via-[#1a4a72] to-[#0EA5E9] rounded-2xl p-7 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest opacity-80">{ts.badge}</span>
        </div>
        <h2 className="text-3xl font-bold mb-1">{ts.title}</h2>
        <p className="text-white/70 text-sm">{ts.subtitle}</p>
      </div>

      {/* Method selector */}
      <div className="flex bg-white rounded-2xl shadow p-1.5 gap-1.5">
        {[
          { id: 'camera', Icon: CameraIcon, label: ts.camera, desc: ts.liveCam   },
          { id: 'upload', Icon: UploadIcon,  label: ts.upload,  desc: ts.photoFile },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => { setScanMethod(m.id); if (mode === 'camera') stopCamera(); setMode('idle') }}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
              ${scanMethod === m.id
                ? 'bg-gradient-to-r from-[#1E3A5F] to-[#0EA5E9] text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <m.Icon className="w-4 h-4" />{m.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {mode === 'loading' && (
        <div className="bg-white rounded-2xl p-14 text-center shadow-lg">
          <div className="flex justify-center gap-3 mb-6">
            <div className="w-4 h-4 bg-[#0EA5E9] rounded-full dot-1" />
            <div className="w-4 h-4 bg-[#1E3A5F] rounded-full dot-2" />
            <div className="w-4 h-4 bg-[#0EA5E9] rounded-full dot-3" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">{ts.loading}</p>
          <p className="text-gray-400 text-sm mt-2">{ts.loadingDesc}</p>
        </div>
      )}

      {/* Error */}
      {mode === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700">
          <div className="font-semibold mb-1">{ts.failed}</div>
          <div className="text-sm">{errorMsg}</div>
          <button onClick={reset} className="mt-3 text-sm font-semibold underline text-red-600">{ts.tryAgain}</button>
        </div>
      )}

      {/* Camera UI */}
      {scanMethod === 'camera' && mode !== 'loading' && mode !== 'error' && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {cameraError && (
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 text-sm text-amber-700 font-medium">
              Camera access denied — use Upload below instead.
            </div>
          )}

          {mode === 'camera' ? (
            <div>
              <div className="relative bg-black">
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className="w-full max-h-72 object-cover"
                />
                {/* Scan frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-2/3 border-2 border-white/60 rounded-xl" />
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center text-white/80 text-xs bg-black/40 py-1">
                  {ts.holdSteady}
                </div>
              </div>
              <div className="flex gap-3 p-4">
                <button
                  onClick={handleCapture}
                  className="flex-1 bg-gradient-to-r from-[#1E3A5F] to-[#0EA5E9] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CameraIcon className="w-5 h-5" /> {ts.capture}
                </button>
                <button
                  onClick={flipCamera}
                  className="px-4 py-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition"
                  title="Flip camera"
                >
                  <RefreshIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { stopCamera(); setMode('idle') }}
                  className="px-4 py-3 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <button
                onClick={startCamera}
                className="w-full bg-gradient-to-r from-[#1E3A5F] to-[#0EA5E9] text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CameraIcon className="w-6 h-6" /> {ts.startCamera}
              </button>
              {/* Drag & drop fallback */}
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#0EA5E9] hover:bg-sky-50/30 transition-all"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) handleFileUpload({ target: { files: [file] } })
                }}
              >
                <div className="flex justify-center mb-2"><PillIcon className="w-10 h-10 text-gray-300" /></div>
                <p className="text-gray-500 font-medium">{ts.dropHere}</p>
                <p className="text-gray-400 text-xs mt-1">JPG, PNG, HEIC supported</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          )}
        </div>
      )}

      {/* Upload UI */}
      {scanMethod === 'upload' && mode !== 'loading' && mode !== 'error' && (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div
            className="border-2 border-dashed border-[#0EA5E9]/40 rounded-2xl p-12 text-center cursor-pointer hover:border-[#0EA5E9] hover:bg-sky-50/30 transition-all"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleFileUpload({ target: { files: [file] } })
            }}
          >
            <div className="flex justify-center mb-3"><UploadIcon className="w-12 h-12 text-[#0EA5E9]/50" /></div>
            <p className="text-[#1E3A5F] font-bold text-lg">{ts.dropHere}</p>
            <p className="text-gray-400 text-sm mt-1">{ts.dropSub}</p>
            <p className="text-gray-300 text-xs mt-2">{ts.formats}</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full bg-gradient-to-r from-[#1E3A5F] to-[#0EA5E9] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <UploadIcon className="w-5 h-5" /> {ts.chooseFile}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>
      )}

      {/* Info banner */}
      {mode === 'idle' && (
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex gap-3">
          <LightbulbIcon className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
          <div className="text-sm text-sky-800">
            <span className="font-semibold">{ts.tip}</span> {ts.tipText}
          </div>
        </div>
      )}
    </div>
  )
}
