// src/components/PatientProfile.jsx — light medical
import { useState, useEffect } from 'react'
import { EditIcon, CheckIcon, LogoutIcon } from './Icons.jsx'
import { useT, useLang } from '../contexts/LanguageContext.jsx'
import { translateNames } from '../utils/claudeApi.js'
import { signOut, updateProfile } from 'firebase/auth'
import { auth } from '../utils/firebase.js'
import { saveUserProfile } from '../utils/userProfile.js'

const inputStyle = {
  background: '#fff',
  border: '1px solid #CBD5E1',
  color: '#0F172A',
  borderRadius: '0.875rem',
  padding: '0.5rem 0.75rem',
  width: '100%',
  fontSize: '0.875rem',
  outline: 'none',
}

export default function PatientProfile({ patient, onUpdate, addToast }) {
  const [isEditing,   setIsEditing]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [formData,    setFormData]    = useState(patient)
  const [translated,  setTranslated]  = useState({})
  const [loggingOut,  setLoggingOut]  = useState(false)
  const t    = useT()
  const lang = useLang()
  const tp   = t.profile

  useEffect(() => {
    if (lang === 'English' || !patient) { setTranslated({}); return }
    const names = [patient.name, ...(patient.conditions || [])].filter(Boolean)
    translateNames([...new Set(names)], lang).then(setTranslated).catch(() => {})
  }, [patient?.name, lang])

  const tx = name => (name ? translated[name] || name : name)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (auth.currentUser) {
        if (formData.name && formData.name !== auth.currentUser.displayName) {
          await updateProfile(auth.currentUser, { displayName: formData.name })
        }
        await saveUserProfile(auth.currentUser.uid, {
          displayName: formData.name,
          language: formData.language,
        })
      }
      onUpdate(formData)
      setIsEditing(false)
      addToast?.('Profile saved', 'success')
    } catch (err) {
      console.error('PatientProfile save error:', err)
      const msg = err?.code === 'permission-denied'
        ? 'Firestore permission denied — check your Firebase security rules (allow read, write: if request.auth != null)'
        : `Save failed: ${err?.message || err?.code || 'Unknown error'}`
      addToast?.(msg, 'error', 8000)
      // Still update local state so the UI reflects the change in this session
      onUpdate(formData)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try { await signOut(auth) } catch { setLoggingOut(false) }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 6px 24px rgba(37,99,235,0.22)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-1" style={{ color: '#fff' }}>{tp.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{tp.subtitle}</p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            {saving
              ? <><div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Saving…</>
              : isEditing
              ? <><CheckIcon className="w-4 h-4" /> {tp.save}</>
              : <><EditIcon  className="w-4 h-4" /> {tp.edit}</>
            }
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl p-6 space-y-5"
        style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>

        {/* Avatar + name */}
        <div className="flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1D56DB, #2563EB)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
            }}
          >
            {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ ...inputStyle, marginBottom: '0.5rem', fontWeight: '700', fontSize: '1rem' }} />
            ) : (
              <h3 className="text-xl font-bold mb-0.5" style={{ color: '#0F172A' }}>{tx(patient.name)}</h3>
            )}
            {isEditing ? (
              <input value={formData.age} onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                type="number" style={{ ...inputStyle, width: '6rem' }} />
            ) : (
              <p style={{ color: '#64748B' }}>{tp.yearsOld(patient.age)}</p>
            )}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>{tp.language}</label>
          {isEditing ? (
            <select value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} style={inputStyle}>
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
              <option>Kannada</option>
              <option>Spanish</option>
            </select>
          ) : (
            <div className="px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(37,99,235,0.06)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.15)' }}>
              {patient.language}
            </div>
          )}
        </div>

        {/* Medical Conditions */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>{tp.conditions}</label>
          <div className="flex flex-wrap gap-2">
            {(isEditing ? formData.conditions : patient.conditions).map((cond, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                style={{ background: 'rgba(8,145,178,0.08)', color: '#0891B2', border: '1px solid rgba(8,145,178,0.18)' }}
              >
                {isEditing ? cond : tx(cond)}
                {isEditing && (
                  <button
                    onClick={() => setFormData({ ...formData, conditions: formData.conditions.filter(c => c !== cond) })}
                    className="ml-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#0891B2' }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <button
                onClick={() => {
                  const newCond = prompt('Enter condition:')
                  if (newCond) setFormData({ ...formData, conditions: [...formData.conditions, newCond] })
                }}
                className="px-3 py-1 border-2 border-dashed rounded-full text-sm transition-all"
                style={{ borderColor: '#CBD5E1', color: '#94A3B8' }}
              >
                {tp.addCondition}
              </button>
            )}
          </div>
        </div>

        {/* Caregiver */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#475569' }}>{tp.emergency}</label>
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={formData.caregiver?.name || ''}
                onChange={e => setFormData({ ...formData, caregiver: { ...formData.caregiver, name: e.target.value } })}
                placeholder={tp.caregiverName}
                style={inputStyle}
              />
              <input
                value={formData.caregiver?.email || ''}
                onChange={e => setFormData({ ...formData, caregiver: { ...formData.caregiver, email: e.target.value } })}
                placeholder={tp.caregiverEmail}
                type="email"
                style={inputStyle}
              />
            </div>
          ) : (
            <div className="p-3 rounded-2xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <p className="font-medium" style={{ color: '#0F172A' }}>{patient.caregiver?.name || tp.notSet}</p>
              <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>{patient.caregiver?.email || ''}</p>
            </div>
          )}
        </div>

        {/* Signed-in email */}
        {auth.currentUser?.email && (
          <div className="pt-1 pb-1">
            <div className="text-xs font-semibold mb-1" style={{ color: '#94A3B8' }}>Signed in as</div>
            <div className="text-sm font-medium" style={{ color: '#475569' }}>{auth.currentUser.email}</div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
        >
          <LogoutIcon className="w-4 h-4" />
          {loggingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
