// src/App.jsx — Agastya AI Medication Intelligence System
import { useState, useEffect, useCallback, useRef } from 'react'
import { patient as defaultPatient } from './data/mockPatient.js'
import { mockPrescriptions } from './data/mockPrescriptions.js'
import {
  checkAndExpireMedications,
  getActiveMedications,
  getAllPrescriptions,
  savePrescription,
  addMedicationToDispenser,
} from './utils/prescriptionDB.js'

import LanguageContext       from './contexts/LanguageContext.jsx'
import { useAuth }           from './contexts/AuthContext.jsx'
import { loadUserProfile }   from './utils/userProfile.js'
import AuthPage              from './components/AuthPage.jsx'
import Navbar                from './components/Navbar.jsx'
import Dashboard             from './components/Dashboard.jsx'
import Scanner               from './components/Scanner.jsx'
import MedAnalysis           from './components/MedAnalysis.jsx'
import PrescriptionScanner   from './components/PrescriptionScanner.jsx'
import PrescriptionLibrary   from './components/PrescriptionLibrary.jsx'
import PrescriptionDetail    from './components/PrescriptionDetail.jsx'
import Schedule              from './components/Schedule.jsx'
import VitalsPanel           from './components/VitalsPanel.jsx'
import AdherenceHistory      from './components/AdherenceHistory.jsx'
import PatientProfile        from './components/PatientProfile.jsx'
import DispenserSettings     from './components/DispenserSettings.jsx'

// ── Toast ─────────────────────────────────────────────────────────────────
const TOAST_COLORS = {
  success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#059669' },
  error:   { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' },
  info:    { bg: '#F0F9FF', border: '#BAE6FD', text: '#0891B2' },
}

function ToastBar({ toasts, onRemove }) {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const s = TOAST_COLORS[t.type] || TOAST_COLORS.info
        return (
          <div
            key={t.id}
            className="px-4 py-3 rounded-2xl flex items-start gap-3 pointer-events-auto toast-enter"
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              boxShadow: '0 4px 16px rgba(15,23,42,0.1)',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.text, boxShadow: `0 0 6px ${s.text}` }} />
            <span className="text-sm font-medium flex-1" style={{ color: s.text }}>{t.message}</span>
            <button onClick={() => onRemove(t.id)} className="shrink-0 text-lg leading-none opacity-40 hover:opacity-80" style={{ color: s.text }}>×</button>
          </div>
        )
      })}
    </div>
  )
}

// ── Seeder ────────────────────────────────────────────────────────────────
async function seedIfEmpty() {
  try {
    const existing = await getAllPrescriptions()
    if (existing.length === 0) {
      for (const p of mockPrescriptions) await savePrescription(p, null)
      const activeMeds = await getActiveMedications()
      if (activeMeds.length === 0) {
        for (const med of defaultPatient.medications) {
          await addMedicationToDispenser({ ...med, source: 'manual', prescriptionId: null })
        }
      }
    }
  } catch (err) {
    console.warn('Seeding skipped:', err)
  }
}

// ════════════════════════════════════════════════════════════════════════
export default function App() {
  const authUser = useAuth()   // undefined=loading, null=guest, object=logged in

  const [activeTab,             setActiveTab]             = useState('home')
  const [patient,               setPatient]               = useState(defaultPatient)
  const [activeMedications,     setActiveMedications]     = useState([])
  const [prescriptions,         setPrescriptions]         = useState([])
  const [scanResult,            setScanResult]            = useState(null)
  const [selectedPrescription,  setSelectedPrescription]  = useState(null)
  const [prescriptionSubView,   setPrescriptionSubView]   = useState('library')
  const [toasts,                setToasts]                = useState([])
  const [initialized,           setInitialized]           = useState(false)
  const toastCounter = useRef(0)

  // Keep patient.name in sync with Firebase displayName; load language from Firestore
  useEffect(() => {
    if (!authUser) return
    const displayName = authUser.displayName || authUser.email?.split('@')[0] || 'User'
    setPatient(prev => ({ ...prev, name: displayName }))
    loadUserProfile(authUser.uid)
      .then(profile => {
        if (profile?.language) {
          setPatient(prev => ({ ...prev, language: profile.language }))
        }
      })
      .catch(() => {})
  }, [authUser?.uid])

  const addToast = useCallback((message, type = 'info', duration = type === 'error' ? 6000 : 4000) => {
    const id = ++toastCounter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const refreshMedications = useCallback(async () => {
    try { setActiveMedications(await getActiveMedications()) }
    catch (err) { console.warn('refreshMedications:', err) }
  }, [])

  const refreshPrescriptions = useCallback(async () => {
    try { setPrescriptions(await getAllPrescriptions()) }
    catch (err) { console.warn('refreshPrescriptions:', err) }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshMedications(), refreshPrescriptions()])
  }, [refreshMedications, refreshPrescriptions])

  useEffect(() => {
    let interval
    ;(async () => {
      try {
        await seedIfEmpty()
        const expired = await checkAndExpireMedications()
        expired.forEach(name => addToast(`Course complete: ${name} removed from dispenser`, 'info', 6000))
        await refreshAll()
        setInitialized(true)
        interval = setInterval(async () => {
          const exp = await checkAndExpireMedications()
          if (exp.length > 0) {
            exp.forEach(name => addToast(`Course complete: ${name} removed from dispenser`, 'info', 6000))
            await refreshAll()
          }
        }, 60 * 60 * 1000)
      } catch (err) {
        console.error('App init error:', err)
        setInitialized(true)
        setActiveMedications(defaultPatient.medications.map((m, i) => ({ ...m, id: i + 1 })))
        setPrescriptions(mockPrescriptions)
      }
    })()
    return () => clearInterval(interval)
  }, [addToast, refreshAll])

  const handlePrescriptionSaved = useCallback(async (prescriptionData, imageBlob) => {
    try {
      const saved = await savePrescription(prescriptionData, imageBlob)
      const medCount = prescriptionData.medications?.length || 0
      for (const med of prescriptionData.medications || []) {
        await addMedicationToDispenser({
          name: med.name, dosage: med.dosage,
          frequency: med.frequencyCode || med.frequency,
          slot: med.slot || 'morning', compartment: med.compartment || 1,
          autoExpire: med.autoExpire || false, expiryDate: med.expiryDate || null,
          durationDays: med.durationDays || null, source: 'prescription', prescriptionId: saved.id,
        })
      }
      await refreshAll()
      addToast(`${medCount} medication${medCount !== 1 ? 's' : ''} added to Agastya dispenser`, 'success')
      setPrescriptionSubView('library')
    } catch (err) {
      console.error('handlePrescriptionSaved:', err)
      addToast('Failed to save prescription. Please try again.', 'error')
    }
  }, [refreshAll, addToast])

  const handlePatientUpdate = useCallback((updated) => {
    setPatient(updated)
    addToast('Profile updated', 'success')
  }, [addToast])

  const handleScanResult = useCallback((result) => setScanResult(result), [])

  const handleAddToSchedule = useCallback(async (med) => {
    try {
      await addMedicationToDispenser({ ...med, source: 'scan', prescriptionId: null })
      await refreshMedications()
      addToast(`${med.name} added to schedule`, 'success')
    } catch {
      addToast('Failed to add to schedule', 'error')
    }
  }, [refreshMedications, addToast])

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (tab !== 'prescriptions') { setPrescriptionSubView('library'); setSelectedPrescription(null) }
    if (tab !== 'scan') setScanResult(null)
  }, [])

  // ── Content renderer ──────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      case 'home':
        return (
          <Dashboard
            patient={patient}
            activeMedications={activeMedications}
            onTabChange={handleTabChange}
          />
        )

      case 'scan':
        return (
          <div className="space-y-6">
            <Scanner patient={patient} onResult={handleScanResult} />
            {scanResult && (
              <MedAnalysis
                result={scanResult}
                patient={patient}
                activeMedications={activeMedications}
                onAddToSchedule={handleAddToSchedule}
                addToast={addToast}
              />
            )}
          </div>
        )

      case 'prescriptions':
        if (prescriptionSubView === 'scan') {
          return <PrescriptionScanner onSaved={handlePrescriptionSaved} addToast={addToast} />
        }
        if (prescriptionSubView === 'detail' && selectedPrescription) {
          return (
            <PrescriptionDetail
              prescription={selectedPrescription}
              onBack={() => { setSelectedPrescription(null); setPrescriptionSubView('library') }}
              onMedicationsChanged={refreshAll}
              addToast={addToast}
            />
          )
        }
        return (
          <PrescriptionLibrary
            prescriptions={prescriptions}
            onView={p => { setSelectedPrescription(p); setPrescriptionSubView('detail') }}
            onScanNew={() => setPrescriptionSubView('scan')}
            addToast={addToast}
          />
        )

      case 'schedule':
        return <Schedule activeMedications={activeMedications} patient={patient} addToast={addToast} />

      case 'vitals':
        return <VitalsPanel patient={patient} />

      case 'history':
        return <AdherenceHistory patient={patient} />

      case 'profile':
        return <PatientProfile patient={patient} onUpdate={handlePatientUpdate} addToast={addToast} />

      case 'settings':
        return (
          <DispenserSettings
            activeMedications={activeMedications}
            onMedicationsChanged={refreshAll}
            addToast={addToast}
          />
        )

      default:
        return null
    }
  }

  // ── Auth loading (Firebase resolving) ────────────────────────────────
  if (authUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EFF3FB, #E3EBF8)' }}>
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl font-black mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 8px 32px rgba(37,99,235,0.28)' }}
          >
            <span style={{ color: '#fff' }}>आ</span>
          </div>
          <div className="flex justify-center gap-2 mb-5">
            <div className="w-3 h-3 rounded-full dot-1" style={{ background: '#2563EB' }} />
            <div className="w-3 h-3 rounded-full dot-2" style={{ background: '#3B82F6' }} />
            <div className="w-3 h-3 rounded-full dot-3" style={{ background: '#2563EB' }} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#0F172A' }}>Agastya</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Knowledge · Care · Intelligence</p>
        </div>
      </div>
    )
  }

  // ── Not logged in — show auth page ────────────────────────────────────
  if (authUser === null) {
    return <AuthPage />
  }

  // ── App loading (DB seeding) ──────────────────────────────────────────
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EFF3FB, #E3EBF8)' }}>
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl font-black mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 8px 32px rgba(37,99,235,0.28)' }}
          >
            <span style={{ color: '#fff' }}>आ</span>
          </div>
          <div className="flex justify-center gap-2 mb-5">
            <div className="w-3 h-3 rounded-full dot-1" style={{ background: '#2563EB' }} />
            <div className="w-3 h-3 rounded-full dot-2" style={{ background: '#3B82F6' }} />
            <div className="w-3 h-3 rounded-full dot-3" style={{ background: '#2563EB' }} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#0F172A' }}>Agastya</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Knowledge · Care · Intelligence</p>
        </div>
      </div>
    )
  }

  // ── Main app ──────────────────────────────────────────────────────────
  return (
    <LanguageContext.Provider value={patient.language || 'English'}>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <ToastBar toasts={toasts} onRemove={removeToast} />
        <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="max-w-5xl mx-auto px-4 pt-20 pb-24 md:pb-8">
          <div key={activeTab} className="fade-up">
            {renderContent()}
          </div>
        </main>
      </div>
    </LanguageContext.Provider>
  )
}
