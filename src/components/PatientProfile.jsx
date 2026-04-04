// src/components/PatientProfile.jsx
import { useState } from 'react'
import { EditIcon, CheckIcon } from './Icons.jsx'
import { useT } from '../contexts/LanguageContext.jsx'

export default function PatientProfile({ patient, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(patient)
  const t = useT()
  const tp = t.profile

  const handleSave = () => {
    onUpdate(formData)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0EA5E9] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{tp.title}</h2>
            <p className="text-white/80">{tp.subtitle}</p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="px-4 py-2 bg-white/20 rounded-xl text-sm font-semibold hover:bg-white/30 transition-all"
          >
            <span className="flex items-center gap-1.5">{isEditing ? <><CheckIcon className="w-4 h-4" /> {tp.save}</> : <><EditIcon className="w-4 h-4" /> {tp.edit}</>}</span>
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1E3A5F] to-[#0EA5E9] rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl mb-2 focus:border-[#0EA5E9] focus:outline-none"
              />
            ) : (
              <h3 className="text-xl font-bold text-gray-800">{patient.name}</h3>
            )}
            {isEditing ? (
              <input
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                type="number"
                className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0EA5E9] focus:outline-none"
              />
            ) : (
              <p className="text-gray-500">{tp.yearsOld(patient.age)}</p>
            )}
          </div>
        </div>

        {/* Language */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{tp.language}</label>
          {isEditing ? (
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0EA5E9] focus:outline-none"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
              <option>Kannada</option>
            </select>
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-xl text-gray-700">{patient.language}</div>
          )}
        </div>

        {/* Medical Conditions */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{tp.conditions}</label>
          <div className="flex flex-wrap gap-2">
            {(isEditing ? formData.conditions : patient.conditions).map((cond, i) => (
              <span key={i} className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm">
                {cond}
                {isEditing && (
                  <button
                    onClick={() => setFormData({
                      ...formData,
                      conditions: formData.conditions.filter(c => c !== cond)
                    })}
                    className="ml-2 text-sky-500 hover:text-red-500"
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
                  if (newCond) setFormData({
                    ...formData,
                    conditions: [...formData.conditions, newCond]
                  })
                }}
                className="px-3 py-1 border-2 border-dashed border-gray-300 rounded-full text-sm text-gray-500 hover:border-[#0EA5E9]"
              >
                {tp.addCondition}
              </button>
            )}
          </div>
        </div>

        {/* Caregiver */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{tp.emergency}</label>
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={formData.caregiver?.name || ''}
                onChange={(e) => setFormData({ ...formData, caregiver: { ...formData.caregiver, name: e.target.value } })}
                placeholder={tp.caregiverName}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0EA5E9] focus:outline-none"
              />
              <input
                value={formData.caregiver?.email || ''}
                onChange={(e) => setFormData({ ...formData, caregiver: { ...formData.caregiver, email: e.target.value } })}
                placeholder={tp.caregiverEmail}
                type="email"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-800">{patient.caregiver?.name || tp.notSet}</p>
              <p className="text-sm text-gray-500">{patient.caregiver?.email || ''}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}