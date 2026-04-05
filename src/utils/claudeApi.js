// src/utils/claudeApi.js
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL   = 'claude-opus-4-5'   // vision-capable model

// ── Core fetch wrapper ────────────────────────────────────────────────────
async function callClaude(messages, systemPrompt = '') {
  if (!API_KEY) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env')

  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), 30_000)

  let response
  try {
    response = await fetch(API_URL, {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 4096,
        system:     systemPrompt,
        messages,
      }),
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    let errBody = ''
    try { errBody = await response.text() } catch {}
    throw new Error(`Claude API error ${response.status}: ${errBody}`)
  }

  const data = await response.json()
  return data.content[0].text
}

// ── JSON parser — strips markdown fences if present ──────────────────────
function parseJSON(text) {
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
  else if (cleaned.startsWith('```'))  cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  return JSON.parse(cleaned.trim())
}

// ─────────────────────────────────────────────────────────────────────────
// analyzeMedication — pill bottle label scan
// Returns structured JSON or throws on hard failure
// ─────────────────────────────────────────────────────────────────────────
export async function analyzeMedication(base64Image, patientContext, mediaType = 'image/jpeg') {
  const {
    name = 'Patient', age = '', conditions = [], medications = [], language = 'English'
  } = patientContext || {}

  const currentMeds   = medications.map(m => m.name).join(', ') || 'None'
  const conditionsList = conditions.join(', ') || 'None'

  const systemPrompt = `You are Agastya, an expert medical AI assistant. Analyze medication labels precisely. Always return ONLY valid JSON — no markdown, no explanation.`

  const userPrompt = `Analyze this medication label for:
Patient: ${name}, Age: ${age}
Conditions: ${conditionsList}
Current medications: ${currentMeds}
Patient language: ${language}

Return ONLY this JSON object (no markdown fences):
{
  "medicationName": "string",
  "genericName": "string",
  "dosage": "string",
  "frequency": "string",
  "slot": "morning|afternoon|night|multiple",
  "compartment": 1,
  "simplifiedInstructions": "plain English instructions",
  "translatedInstructions": "instructions in ${language}",
  "warnings": ["string"],
  "interactions": [
    { "withMedication": "string", "severity": "high|medium|low", "description": "string" }
  ],
  "vitalsWarning": null,
  "sideEffects": ["string"],
  "foodInteractions": "string or null",
  "storageInstructions": "string",
  "category": "string"
}

Compartment: morning=1, afternoon=2, night=3, multiple=1.
Interactions: check against [${currentMeds}].`

  const responseText = await callClaude([
    {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
        { type: 'text',  text: userPrompt },
      ],
    },
  ], systemPrompt)

  return parseJSON(responseText)
}

// ─────────────────────────────────────────────────────────────────────────
// analyzePrescription — handwritten Indian clinic prescription scan
// Throws on failure so callers can show proper error UI
// ─────────────────────────────────────────────────────────────────────────
export async function analyzePrescription(base64Image, mediaType = 'image/jpeg') {
  const today = new Date().toISOString().split('T')[0]

  const systemPrompt = `You are an expert medical AI trained to read handwritten Indian clinic prescriptions.
This prescription may contain mixed regional language (Kannada, Hindi, Tamil) and English,
doctor's messy handwriting, abbreviated medication names, and dosage codes like BD, TDS, OD, HS, SOS.
Always return ONLY valid JSON — no markdown, no explanation, no extra text.`

  const userPrompt = `Read this handwritten prescription carefully. Today's date is ${today}.

Frequency codes:
OD = once daily (morning), BD = twice daily (morning+night), TDS = three times daily,
QID = four times, HS = bedtime (night), SOS = as needed

Compartment: morning-only=1, afternoon-only=2, night-only=3, multiple=1

For each medication with a duration (e.g. "x10 days", "5D", "1/52"),
set autoExpire=true and calculate expiryDate = today + durationDays.

Return ONLY this JSON (no markdown fences, no extra text):
{
  "clinicName": "string",
  "doctorName": "string",
  "doctorPhone": "string or empty",
  "patientName": "string",
  "patientAge": "string",
  "patientSex": "string",
  "date": "${today}",
  "diagnosis": "string",
  "vitals": {
    "bp": "string or null",
    "hr": "string or null",
    "spo2": "string or null",
    "temp": "string or null",
    "weight": "string or null"
  },
  "medications": [
    {
      "name": "string",
      "dosage": "string",
      "frequency": "string",
      "frequencyCode": "OD|BD|TDS|QID|HS|SOS|other",
      "durationDays": number or null,
      "slot": "morning|afternoon|night|multiple",
      "compartment": 1,
      "autoExpire": true,
      "expiryDate": "YYYY-MM-DD or null",
      "instructions": "string"
    }
  ],
  "conditionCategory": "Fever & Infections|Hypertension|Diabetes|Respiratory|Mental Health|Pain/Inflammation|General",
  "notes": "string or null"
}`

  // This call will THROW on any failure — callers handle the error
  const responseText = await callClaude([
    {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
        { type: 'text',  text: userPrompt },
      ],
    },
  ], systemPrompt)

  const data = parseJSON(responseText)

  // Post-process: recalculate expiry dates from today
  if (data.medications) {
    data.medications = data.medications.map(med => {
      if (med.durationDays && med.autoExpire) {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + med.durationDays)
        med.expiryDate = expiry.toISOString().split('T')[0]
      }
      return med
    })
  }

  return data
}

// ─────────────────────────────────────────────────────────────────────────
// generateCaregiverMessage
// ─────────────────────────────────────────────────────────────────────────
export async function generateCaregiverMessage(patient, medication, reason) {
  const systemPrompt = `Generate a concise, professional caregiver alert message. 2-3 sentences maximum. Plain text only.`
  const userPrompt   = `Patient: ${patient.name}, Age: ${patient.age}. Medication: ${medication?.name || 'unknown'}. Reason for alert: ${reason}. Write the caregiver message now.`

  try {
    return await callClaude([{ role: 'user', content: userPrompt }], systemPrompt)
  } catch {
    return `Alert: ${patient.name} needs attention regarding ${medication?.name || 'their medication'}. Reason: ${reason}. Please check in at your earliest convenience. — Agastya AI`
  }
}

// ─────────────────────────────────────────────────────────────────────────
// translateNames — batch-transliterate medicine/person names into target script
// Returns { original: translated, ... } — falls back to empty {} on error
// ─────────────────────────────────────────────────────────────────────────
export async function translateNames(names, targetLanguage) {
  if (!targetLanguage || targetLanguage === 'English' || !names || names.length === 0) return {}
  try {
    const systemPrompt = `You are a medical transliteration assistant. Transliterate or translate names into the target language script. Return ONLY valid JSON, no markdown, no extra text.`
    const userPrompt = `Transliterate/translate the following into ${targetLanguage} script.
Rules:
- Medication names: use standard pharmaceutical transliteration (phonetic mapping).
- Person names (doctors, patients): phonetic transliteration into ${targetLanguage} script.
- Clinic/hospital names: transliterate into ${targetLanguage} script.
- Keep numbers, dosages, and abbreviations (like mg, OD, BD) as-is in Latin script.

Names to translate: ${JSON.stringify(names)}

Return ONLY a JSON object mapping each original name to its transliteration:
{ "original name": "transliterated name", ... }`
    const raw = await callClaude([{ role: 'user', content: userPrompt }], systemPrompt)
    return parseJSON(raw)
  } catch {
    return {}
  }
}

// ─────────────────────────────────────────────────────────────────────────
// translateInstructions
// ─────────────────────────────────────────────────────────────────────────
export async function translateInstructions(text, targetLanguage) {
  if (!targetLanguage || targetLanguage === 'English') return text
  try {
    const systemPrompt = `Translate medical instructions accurately. Return only the translated text.`
    const userPrompt   = `Translate to ${targetLanguage}: "${text}"`
    return await callClaude([{ role: 'user', content: userPrompt }], systemPrompt)
  } catch {
    return text
  }
}
