import { useState } from 'react'
import { sendCaregiverAlert } from '../utils/emailAlert.js'
import { generateCaregiverMessage } from '../utils/claudeApi.js'
import { CheckCircleIcon, SparkleIcon, AlertIcon, SendIcon } from './Icons.jsx'

const ALERT_REASONS = [
  'Dangerous drug interaction detected',
  'Dose missed for over 30 minutes',
  'Vitals anomaly with high-risk medication',
  'Prescription course completed',
  'Custom alert',
]

export default function CaregiverAlert({ patient, medication, addToast }) {
  const [caregiverName, setCaregiverName] = useState(patient.caregiver?.name || '')
  const [caregiverEmail, setCaregiverEmail] = useState(patient.caregiver?.email || '')
  const [reason, setReason] = useState(ALERT_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const finalReason = reason === 'Custom alert' ? customReason : reason
      const msg = await generateCaregiverMessage(patient, medication, finalReason)
      setMessage(msg)
    } catch {
      setMessage(
        `Dear ${caregiverName}, this is an alert regarding ${patient.name}'s medication ${medication?.name || ''}. Reason: ${reason}. Please check in with the patient at your earliest convenience. — Agastya AI`
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleSend = async () => {
    if (!caregiverEmail) {
      addToast('Please enter caregiver email', 'error')
      return
    }
    setSending(true)
    try {
      const result = await sendCaregiverAlert(
        { name: caregiverName, email: caregiverEmail },
        patient,
        {
          name: medication?.name || 'Unknown',
          dosage: medication?.dosage || '',
          alertReason: reason === 'Custom alert' ? customReason : reason,
          message: message,
          scheduledTime: new Date().toLocaleTimeString(),
        }
      )
      if (result.success) {
        setSent(true)
        addToast(`Alert sent to ${caregiverName}`, 'success')
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to send alert. Check EmailJS configuration.', 'error')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <div className="flex justify-center mb-2"><CheckCircleIcon className="w-10 h-10 text-emerald-500" /></div>
        <div className="font-bold text-emerald-700">Alert sent to {caregiverName}</div>
        <div className="text-sm text-emerald-600 mt-1">{caregiverEmail}</div>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm text-emerald-600 underline"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <h3 className="text-lg font-bold text-[#1E3A5F]">Alert Caregiver</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-[#6B7280]">Caregiver Name</label>
          <input
            value={caregiverName}
            onChange={(e) => setCaregiverName(e.target.value)}
            className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
            placeholder="Name"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#6B7280]">Email</label>
          <input
            value={caregiverEmail}
            onChange={(e) => setCaregiverEmail(e.target.value)}
            type="email"
            className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
            placeholder="email@example.com"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-[#6B7280]">Alert Reason</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
        >
          {ALERT_REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      {reason === 'Custom alert' && (
        <input
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Describe the situation..."
          className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none"
        />
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full border-2 border-[#1E3A5F] text-[#1E3A5F] py-2 rounded-xl font-semibold text-sm hover:bg-[#1E3A5F] hover:text-white transition-all disabled:opacity-50"
      >
        {generating ? 'Generating...' : <span className="flex items-center justify-center gap-1.5"><SparkleIcon className="w-4 h-4" /> Generate AI Message</span>}
      </button>

      {message && (
        <div>
          <label className="text-xs font-semibold text-[#6B7280]">Message Preview</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full mt-1 border-2 rounded-xl px-3 py-2 text-sm focus:border-sky-500 outline-none resize-none"
            rows={4}
          />
        </div>
      )}

      {/* Mock SMS preview */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
        <div className="text-xs text-[#6B7280] font-semibold mb-2">SMS Preview (Demo)</div>
        <div className="bg-emerald-500 text-white text-xs rounded-xl rounded-bl-none px-3 py-2 inline-block max-w-xs">
          Agastya Alert: {patient.name} — {medication?.name} — {reason === 'Custom alert' ? customReason : reason}
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={sending || !caregiverEmail}
        className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50"
      >
        {sending ? 'Sending...' : <span className="flex items-center justify-center gap-1.5"><AlertIcon className="w-4 h-4" /> Send Alert to Caregiver</span>}
      </button>
    </div>
  )
}
