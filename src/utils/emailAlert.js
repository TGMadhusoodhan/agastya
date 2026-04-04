import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export async function sendCaregiverAlert(caregiverData, patientData, medData) {
  try {
    const templateParams = {
      caregiver_name: caregiverData.name || 'Caregiver',
      caregiver_email: caregiverData.email,
      patient_name: patientData.name || 'Patient',
      patient_age: patientData.age || '',
      medication_name: medData.name || '',
      medication_dose: medData.dosage || '',
      alert_reason: medData.alertReason || 'Medication alert',
      scheduled_time: medData.scheduledTime || '',
      timestamp: new Date().toLocaleString(),
      message: medData.message || '',
    }

    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
    return { success: true, result }
  } catch (error) {
    console.error('EmailJS error:', error)
    return { success: false, error: error.message || 'Failed to send alert' }
  }
}
