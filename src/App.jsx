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

// Language context
import LanguageContext   from './contexts/LanguageContext.jsx'

// Components
import Navbar            from './components/Navbar.jsx'
import Scanner           from './components/Scanner.jsx'
import MedAnalysis       from './components/MedAnalysis.jsx'
import PrescriptionScanner  from './components/PrescriptionScanner.jsx'
import PrescriptionLibrary  from './components/PrescriptionLibrary.jsx'
import PrescriptionDetail   from './components/PrescriptionDetail.jsx'
import Schedule          from './components/Schedule.jsx'
import VitalsPanel       from './components/VitalsPanel.jsx'
import AdherenceHistory  from './components/AdherenceHistory.jsx'
import PatientProfile    from './components/PatientProfile.jsx'
import DispenserSettings from './components/DispenserSettings.jsx'

// ── Toast component ─────────────────────────────────────────────────────
const TOAST_COLORS = {
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-sky-500',
}

function ToastBar({ toasts, onRemove }) {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`${TOAST_COLORS[t.type] || TOAST_COLORS.info} text-white px-4 py-3 rounded-xl shadow-xl flex items-start gap-2 pointer-events-auto toast-enter`}
        >
          <span className="text-sm font-medium flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="shrink-0 text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
      ))}
    </div>
  )
}

// ── Seeder: load mock prescriptions into IndexedDB on first run ──────────
async function seedIfEmpty() {
  try {
    const existing = await getAllPrescriptions()
    if (existing.length === 0) {
      // Save mock prescriptions so library isn't empty on first load
      for (const p of mockPrescriptions) {
        await savePrescription(p, null)
      }
      // Seed active medications for patient's chronic meds
      const activeMeds = await getActiveMedications()
      if (activeMeds.length === 0) {
        for (const med of defaultPatient.medications) {
          await addMedicationToDispenser({
            ...med,
            source: 'manual',
            prescriptionId: null,
          })
        }
      }
    }
  } catch (err) {
    console.warn('Seeding skipped:', err)
  }
}

// ══════════════════════════════════════════════════════════════════════
export default function App() {
  // ── Core state ────────────────────────────────────────────────────
  const [activeTab,           setActiveTab]           = useState('scan')
  const [patient,             setPatient]             = useState(defaultPatient)
  const [activeMedications,   setActiveMedications]   = useState([])
  const [prescriptions,       setPrescriptions]       = useState([])
  const [scanResult,          setScanResult]          = useState(null)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [prescriptionSubView, setPrescriptionSubView] = useState('library') // library | scan | detail
  const [toasts,              setToasts]              = useState([])
  const [initialized,         setInitialized]         = useState(false)
  const toastCounter = useRef(0)

  // ── Toast helpers ─────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastCounter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── DB helpers ────────────────────────────────────────────────────
  const refreshMedications = useCallback(async () => {
    try {
      const meds = await getActiveMedications()
      setActiveMedications(meds)
    } catch (err) {
      console.warn('refreshMedications:', err)
    }
  }, [])

  const refreshPrescriptions = useCallback(async () => {
    try {
      const prescs = await getAllPrescriptions()
      setPrescriptions(prescs)
    } catch (err) {
      console.warn('refreshPrescriptions:', err)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshMedications(), refreshPrescriptions()])
  }, [refreshMedications, refreshPrescriptions])

  // ── Init: seed + load + expiry check ─────────────────────────────
  useEffect(() => {
    let interval

    ;(async () => {
      try {
        // Seed demo data on first run
        await seedIfEmpty()

        // Check for expired medications
        const expired = await checkAndExpireMedications()
        if (expired.length > 0) {
          expired.forEach(name =>
            addToast(`Course complete: ${name} removed from dispenser`, 'info', 6000)
          )
        }

        // Load all data
        await refreshAll()
        setInitialized(true)

        // Re-check every hour
        interval = setInterval(async () => {
          const exp = await checkAndExpireMedications()
          if (exp.length > 0) {
            exp.forEach(name =>
              addToast(`Course complete: ${name} removed from dispenser`, 'info', 6000)
            )
            await refreshAll()
          }
        }, 60 * 60 * 1000)
      } catch (err) {
        console.error('App init error:', err)
        setInitialized(true) // still show UI
        // Fallback: show mock medications
        setActiveMedications(defaultPatient.medications.map((m, i) => ({ ...m, id: i + 1 })))
        setPrescriptions(mockPrescriptions)
      }
    })()

    return () => clearInterval(interval)
  }, [addToast, refreshAll])

  // ── Handlers ──────────────────────────────────────────────────────

  // Called when PrescriptionScanner confirms an extracted prescription
  const handlePrescriptionSaved = useCallback(async (prescriptionData, imageBlob) => {
    try {
      const saved = await savePrescription(prescriptionData, imageBlob)

      // Add all medications to dispenser
      const medCount = prescriptionData.medications?.length || 0
      for (const med of prescriptionData.medications || []) {
        await addMedicationToDispenser({
          name:           med.name,
          dosage:         med.dosage,
          frequency:      med.frequencyCode || med.frequency,
          slot:           med.slot || 'morning',
          compartment:    med.compartment || 1,
          autoExpire:     med.autoExpire || false,
          expiryDate:     med.expiryDate || null,
          durationDays:   med.durationDays || null,
          source:         'prescription',
          prescriptionId: saved.id,
        })
      }

      await refreshAll()
      addToast(
        `${medCount} medication${medCount !== 1 ? 's' : ''} added to Agastya dispenser`,
        'success'
      )
      // Navigate to library
      setPrescriptionSubView('library')
    } catch (err) {
      console.error('handlePrescriptionSaved:', err)
      addToast('Failed to save prescription. Please try again.', 'error')
    }
  }, [refreshAll, addToast])

  // Called when user updates their profile
  const handlePatientUpdate = useCallback((updated) => {
    setPatient(updated)
    addToast('Profile updated', 'success')
  }, [addToast])

  // Called when scan tab gets a result
  const handleScanResult = useCallback((result) => {
    setScanResult(result)
  }, [])

  // Called when "Add to Schedule" in MedAnalysis
  const handleAddToSchedule = useCallback(async (med) => {
    try {
      await addMedicationToDispenser({
        ...med,
        source: 'scan',
        prescriptionId: null,
      })
      await refreshMedications()
      addToast(`${med.name} added to schedule`, 'success')
    } catch (err) {
      addToast('Failed to add to schedule', 'error')
    }
  }, [refreshMedications, addToast])

  // ── Render helpers ─────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeTab) {

      // ── Scan tab ──────────────────────────────────────────────────
      case 'scan':
        return (
          <div className="space-y-6">
            <Scanner
              patient={patient}
              onResult={handleScanResult}
            />
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

      // ── Prescriptions tab ─────────────────────────────────────────
      case 'prescriptions':
        if (prescriptionSubView === 'scan') {
          return (
            <PrescriptionScanner
              onSaved={handlePrescriptionSaved}
              addToast={addToast}
            />
          )
        }
        if (prescriptionSubView === 'detail' && selectedPrescription) {
          return (
            <PrescriptionDetail
              prescription={selectedPrescription}
              onBack={() => {
                setSelectedPrescription(null)
                setPrescriptionSubView('library')
              }}
              onMedicationsChanged={refreshAll}
              addToast={addToast}
            />
          )
        }
        return (
          <PrescriptionLibrary
            prescriptions={prescriptions}
            onView={(p) => {
              setSelectedPrescription(p)
              setPrescriptionSubView('detail')
            }}
            onScanNew={() => setPrescriptionSubView('scan')}
            addToast={addToast}
          />
        )

      // ── Schedule tab ──────────────────────────────────────────────
      case 'schedule':
        return (
          <Schedule
            activeMedications={activeMedications}
            patient={patient}
            addToast={addToast}
          />
        )

      // ── Vitals tab ────────────────────────────────────────────────
      case 'vitals':
        return <VitalsPanel patient={patient} />

      // ── History tab ───────────────────────────────────────────────
      case 'history':
        return <AdherenceHistory patient={patient} />

      // ── Profile tab ───────────────────────────────────────────────
      case 'profile':
        return (
          <PatientProfile
            patient={patient}
            onUpdate={handlePatientUpdate}
          />
        )

      // ── Settings tab ──────────────────────────────────────────────
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

  // ── Loading screen ────────────────────────────────────────────────
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1E3A5F] to-[#0EA5E9] rounded-3xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-2xl">
            आ
          </div>
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-[#0EA5E9] rounded-full dot-1" />
            <div className="w-3 h-3 bg-[#1E3A5F] rounded-full dot-2" />
            <div className="w-3 h-3 bg-[#0EA5E9] rounded-full dot-3" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Agastya</h1>
          <p className="text-[#6B7280] text-sm mt-1">Knowledge · Care · Intelligence</p>
        </div>
      </div>
    )
  }

  // ── Main app ──────────────────────────────────────────────────────
  return (
    <LanguageContext.Provider value={patient.language || 'English'}>
      <div className="min-h-screen bg-[#F0F4F8]">
        <ToastBar toasts={toasts} onRemove={removeToast} />

        <Navbar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            // Reset sub-views when navigating away
            if (tab !== 'prescriptions') {
              setPrescriptionSubView('library')
              setSelectedPrescription(null)
            }
            if (tab !== 'scan') {
              setScanResult(null)
            }
          }}
        />

        {/* Main content — offset for fixed navbar + mobile bottom bar */}
        <main className="max-w-5xl mx-auto px-4 pt-20 pb-24 md:pb-8">
          {renderContent()}
        </main>
      </div>
    </LanguageContext.Provider>
  )
}
