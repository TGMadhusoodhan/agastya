// src/components/CaregiverAlert.jsx — light medical
import { useState } from 'react'
import { sendCaregiverAlert } from '../utils/emailAlert.js'
import { generateCaregiverMessage } from '../utils/claudeApi.js'
import { CheckCircleIcon, SparkleIcon, AlertIcon } from './Icons.jsx'

const ALERT_REASONS = [
  'Dangerous drug interaction detected',
  'Dose missed for over 30 minutes',
  'Vitals anomaly with high-risk medication',
  'Prescription course completed',
  'Custom alert',
]

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

export default function CaregiverAlert({ patient, medication, addToast }) {
  const [caregiverName,  setCaregiverName]  = useState(patient.caregiver?.name || '')
  const [caregiverEmail, setCaregiverEmail] = useState(patient.caregiver?.email || '')
  const [reason,         setReason]         = useState(ALERT_REASONS[0])
  const [customReason,   setCustomReason]   = useState('')
  const [message,        setMessage]        = useState('')
  const [generating,     setGenerating]     = useState(false)
  const [sending,        setSending]        = useState(false)
  const [sent,           setSent]           = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const msg = await generateCaregiverMessage(patient, medication, reason === 'Custom alert' ? customReason : reason)
      setMessage(msg)
    } catch {
      setMessage(`Dear ${caregiverName}, this is an alert for ${patient.name}'s medication ${medication?.name || ''}. Reason: ${reason}. — Agastya AI`)
    } finally { setGenerating(false) }
  }

  const handleSend = async () => {
    if (!caregiverEmail) { addToast('Please enter caregiver email', 'error'); return }
    setSending(true)
    try {
      const result = await sendCaregiverAlert(
        { name: caregiverName, email: caregiverEmail },
        patient,
        { name: medication?.name || 'Unknown', dosage: medication?.dosage || '', alertReason: reason === 'Custom alert' ? customReason : reason, message, scheduledTime: new Date().toLocaleTimeString() }
      )
      if (result.success) { setSent(true); addToast(`Alert sent to ${caregiverName}`, 'success') }
      else throw new Error(result.error)
    } catch (err) {
      console.error(err); addToast('Failed to send alert. Check EmailJS configuration.', 'error')
    } finally { setSending(false) }
  }

  const cardStyle = { background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.06)', borderRadius: '1.5rem', padding: '1.5rem' }

  if (sent) return (
    <div className="rounded-3xl p-8 text-center" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
      <CheckCircleIcon className="w-12 h-12 mx-auto mb-3" style={{ color: '#059669' }} />
      <div className="font-bold text-lg" style={{ color: '#059669' }}>Alert sent to {caregiverName}</div>
      <div className="text-sm mt-1" style={{ color: '#64748B' }}>{caregiverEmail}</div>
      <button onClick={() => setSent(false)} className="mt-4 text-sm underline" style={{ color: '#059669' }}>Send another</button>
    </div>
  )

  return (
    <div style={cardStyle} className="space-y-4">
      <h3 className="font-black text-lg" style={{ color: '#0F172A' }}>Alert Caregiver</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748B' }}>Caregiver Name</label>
          <input value={caregiverName} onChange={e => setCaregiverName(e.target.value)} style={inputStyle} placeholder="Name" />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748B' }}>Email</label>
          <input value={caregiverEmail} onChange={e => setCaregiverEmail(e.target.value)} type="email" style={inputStyle} placeholder="email@example.com" />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748B' }}>Alert Reason</label>
        <select value={reason} onChange={e => setReason(e.target.value)} style={inputStyle}>
          {ALERT_REASONS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {reason === 'Custom alert' && (
        <input value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Describe the situation…" style={inputStyle} />
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }}
      >
        {generating ? 'Generating…' : <><SparkleIcon className="w-4 h-4" /> Generate AI Message</>}
      </button>

      {message && (
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#64748B' }}>Message Preview</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>
      )}

      {/* SMS preview */}
      <div className="rounded-2xl p-3" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
        <div className="text-xs font-bold mb-2" style={{ color: '#64748B' }}>SMS Preview (Demo)</div>
        <div className="text-xs px-3 py-2 rounded-2xl rounded-bl-none inline-block max-w-xs" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>
          Agastya Alert: {patient.name} — {medication?.name} — {reason === 'Custom alert' ? customReason : reason}
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={sending || !caregiverEmail}
        className="w-full py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#cc2a40,#FF4D6A)', color: '#fff', boxShadow: '0 4px 20px rgba(255,77,106,0.25)' }}
      >
        {sending ? 'Sending…' : <><AlertIcon className="w-4 h-4" /> Send Alert to Caregiver</>}
      </button>
    </div>
  )
}
