// src/components/PatientProfile.jsx — dark glass
import { useState, useEffect } from 'react'
import { EditIcon, CheckIcon } from './Icons.jsx'
import { useT, useLang } from '../contexts/LanguageContext.jsx'
import { translateNames } from '../utils/claudeApi.js'

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

export default function PatientProfile({ patient, onUpdate }) {
  const [isEditing,   setIsEditing]   = useState(false)
  const [formData,    setFormData]    = useState(patient)
  const [translated,  setTranslated]  = useState({})
  const t    = useT()
  const lang = useLang()
  const tp   = t.profile

  useEffect(() => {
    if (lang === 'English' || !patient) { setTranslated({}); return }
    const names = [patient.name, ...(patient.conditions || [])].filter(Boolean)
    translateNames([...new Set(names)], lang).then(setTranslated).catch(() => {})
  }, [patient?.name, lang])

  const tx = name => (name ? translated[name] || name : name)

  const handleSave = () => { onUpdate(formData); setIsEditing(false) }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'rgba(10,22,34,0.85)', border: '1px solid rgba(0,232,123,0.15)', backdropFilter: 'blur(20px)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,232,123,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,232,123,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--t1)' }}>{tp.title}</h2>
            <p style={{ color: 'var(--t3)' }}>{tp.subtitle}</p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all flex items-center gap-1.5"
            style={{ background: 'rgba(0,232,123,0.1)', color: '#00E87B', border: '1px solid rgba(0,232,123,0.25)' }}
          >
            {isEditing
              ? <><CheckIcon className="w-4 h-4" /> {tp.save}</>
              : <><EditIcon  className="w-4 h-4" /> {tp.edit}</>
            }
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl p-6 space-y-5"
        style={{ background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.1)', backdropFilter: 'blur(20px)' }}>

        {/* Avatar + name */}
        <div className="flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
            style={{
              background: 'linear-gradient(135deg,rgba(10,22,34,0.9),rgba(6,12,16,0.95))',
              border: '2px solid rgba(0,232,123,0.3)',
              color: '#00E87B',
              boxShadow: '0 0 20px rgba(0,232,123,0.12)',
              textShadow: '0 0 12px rgba(0,232,123,0.5)',
            }}
          >
            {patient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ ...inputStyle, marginBottom: '0.5rem', fontWeight: '700', fontSize: '1rem' }} />
            ) : (
              <h3 className="text-xl font-bold mb-0.5" style={{ color: 'var(--t1)' }}>{tx(patient.name)}</h3>
            )}
            {isEditing ? (
              <input value={formData.age} onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                type="number" style={{ ...inputStyle, width: '6rem' }} />
            ) : (
              <p style={{ color: 'var(--t3)' }}>{tp.yearsOld(patient.age)}</p>
            )}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t2)' }}>{tp.language}</label>
          {isEditing ? (
            <select value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} style={inputStyle}>
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
              <option>Kannada</option>
            </select>
          ) : (
            <div className="px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(0,232,123,0.05)', color: 'var(--t1)', border: '1px solid rgba(0,232,123,0.1)' }}>
              {patient.language}
            </div>
          )}
        </div>

        {/* Medical Conditions */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t2)' }}>{tp.conditions}</label>
          <div className="flex flex-wrap gap-2">
            {(isEditing ? formData.conditions : patient.conditions).map((cond, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                style={{ background: 'rgba(0,200,255,0.1)', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.2)' }}
              >
                {isEditing ? cond : tx(cond)}
                {isEditing && (
                  <button
                    onClick={() => setFormData({ ...formData, conditions: formData.conditions.filter(c => c !== cond) })}
                    className="ml-1 hover:opacity-70 transition-opacity"
                    style={{ color: '#00C8FF' }}
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
                style={{ borderColor: 'rgba(0,232,123,0.2)', color: 'var(--t3)' }}
              >
                {tp.addCondition}
              </button>
            )}
          </div>
        </div>

        {/* Caregiver */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t2)' }}>{tp.emergency}</label>
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
            <div className="p-3 rounded-2xl" style={{ background: 'rgba(0,232,123,0.05)', border: '1px solid rgba(0,232,123,0.1)' }}>
              <p className="font-medium" style={{ color: 'var(--t1)' }}>{patient.caregiver?.name || tp.notSet}</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--t3)' }}>{patient.caregiver?.email || ''}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
