# Agastya — AI Medication Intelligence System

> **Knowledge · Care · Intelligence**

Agastya is a full-stack AI-powered medication management system built for Indian households. It combines a React web app, a physical smart dispenser (simulated in Blender 3D), and Claude AI to help elderly patients manage medications safely — with multilingual support, prescription scanning, caregiver alerts, and automated dispenser control.

---

## Features

| Feature | Description |
|---|---|
| **Pill Bottle Scanner** | Camera scans any medication bottle — Claude AI reads the label, checks drug interactions, and assigns it to the correct dispenser compartment |
| **Prescription Scanner** | Scans handwritten Indian clinic prescriptions (Kannada, Hindi, Tamil + English) — Claude extracts medications, dosages, frequency codes (OD/BD/TDS) and sets expiry dates |
| **Smart Dispenser Control** | Click Dispense → 3…2…1 countdown → Blender 3D animation plays → confirmation email sent automatically |
| **Multilingual UI** | Full interface in English, Hindi, Tamil, Kannada — medication instructions translated by Claude |
| **Pharmacy Voice Mode** | Full-screen mode the patient shows to the pharmacist — speaks medication name aloud in Tamil/Spanish |
| **Caregiver Alerts** | AI-generated alert messages emailed to caregiver via EmailJS |
| **Medication Schedule** | Morning / Afternoon / Night slots with take/skip tracking and live adherence percentage |
| **Prescription Library** | All scanned prescriptions stored in IndexedDB — searchable by date, disease, or doctor |
| **Auto-Expiry** | Medications from timed prescriptions auto-remove from dispenser when the course ends |
| **Vitals Panel** | Live heart rate, SpO2, stress, and sleep monitoring with sparkline trends |
| **Adherence History** | Full history table with CSV export |
| **Patient Profile** | Editable name, age, language, conditions, and caregiver contact |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| AI | Claude API (`claude-opus-4-5`) — vision + text |
| Database | IndexedDB via `idb` (localStorage fallback) |
| Email | EmailJS — caregiver alerts + dispenser confirmation |
| Voice | Web Speech API (`speechSynthesis`) |
| Dispenser Bridge | Flask (Python) — HTTP bridge server |
| 3D Simulation | Blender + Python polling script |

---

## Project Structure

```
agastya/
├── src/
│   ├── App.jsx                        # Root — tab routing, state, toasts
│   ├── components/
│   │   ├── Dashboard.jsx              # Home — health score, metrics, quick actions
│   │   ├── Scanner.jsx                # Pill bottle camera/upload scanner
│   │   ├── MedAnalysis.jsx            # AI analysis results + actions
│   │   ├── PrescriptionScanner.jsx    # Handwritten prescription scanner
│   │   ├── PrescriptionLibrary.jsx    # All saved prescriptions
│   │   ├── PrescriptionDetail.jsx     # Single prescription view + dispense
│   │   ├── Schedule.jsx               # Daily medication schedule
│   │   ├── DispenserBridge.jsx        # Dispenser UI — countdown + polling + email
│   │   ├── DispenserSettings.jsx      # Add/remove/pause dispenser medications
│   │   ├── VitalsPanel.jsx            # Live vitals with sparklines
│   │   ├── AdherenceHistory.jsx       # History table + CSV export
│   │   ├── PatientProfile.jsx         # Edit patient info + caregiver
│   │   ├── CaregiverAlert.jsx         # AI-generated caregiver alert emails
│   │   ├── PharmacyVoice.jsx          # Full-screen pharmacy voice mode
│   │   ├── VoiceOutput.jsx            # Read instructions aloud
│   │   ├── Navbar.jsx                 # Responsive nav (desktop + mobile bottom bar)
│   │   └── Icons.jsx                  # SVG icon set
│   ├── utils/
│   │   ├── claudeApi.js               # All Claude API calls (analyze, translate, alert)
│   │   ├── prescriptionDB.js          # IndexedDB CRUD + auto-expiry logic
│   │   ├── dispenser.js               # Flask dispenser HTTP client
│   │   ├── emailAlert.js              # EmailJS caregiver alert sender
│   │   ├── voiceEngine.js             # Web Speech API wrapper (Linux/Chrome safe)
│   │   ├── healthData.js              # Vitals simulation with variance
│   │   └── i18n.js                    # Translations — English, Hindi, Tamil, Kannada
│   ├── contexts/
│   │   └── LanguageContext.jsx        # Language provider + useT / useLang hooks
│   └── data/
│       ├── mockPatient.js             # Default patient — Rajesh Kumar, 68, Tamil
│       ├── mockPrescriptions.js       # Sample prescriptions (fever + hypertension)
│       ├── mockVitals.js              # Base vitals reference values
│       └── mockHistory.js             # 30-day adherence history
├── dispenser-bridge/
│   ├── server.py                      # Flask bridge — /dispense, /pending, /status
│   └── blender_dispenser.py          # Blender Python — polls Flask, plays animation
├── .env.example                       # Template for environment variables
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Blender (optional — only needed for 3D animation)

```bash
# Python dependencies
pip install flask flask-cors requests
```

### Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
VITE_ANTHROPIC_API_KEY=          # Claude API key — console.anthropic.com
VITE_EMAILJS_SERVICE_ID=         # EmailJS service ID
VITE_EMAILJS_TEMPLATE_ID=        # Caregiver alert template ID
VITE_EMAILJS_DISPENSER_TEMPLATE_ID=  # Dispenser confirmation template ID
VITE_EMAILJS_PUBLIC_KEY=         # EmailJS public key
```

### Install Frontend

```bash
npm install
```

---

## Running the Project

Start these **in order**, each in a separate terminal:

### Step 1 — Flask Dispenser Bridge
```bash
cd dispenser-bridge
python server.py
```
```
Agastya Dispenser Bridge — http://localhost:5000
```

### Step 2 — React App
```bash
npm run dev
```
Open **http://localhost:5173**

### Step 3 — Blender 3D Dispenser (optional)
```bash
blender your_dispenser_file.blend
```
In Blender's **Text Editor**:
1. Open `dispenser-bridge/blender_dispenser.py`
2. Press **Alt+P** to run the script
3. Check the terminal for:
```
[Agastya] Blender dispenser ready.
[Agastya] Frame ranges:
  Compartment 1 (Morning): frames 1–120
  Compartment 2 (Afternoon): frames 1–120
  Compartment 3 (Night): frames 1–120
```

> The app works fully without Blender. If the dispenser is offline, it falls back gracefully and still sends the confirmation email.

---

## Dispenser Flow

```
Click "Dispense Now"
  → 3…2…1 countdown (DispenserBridge.jsx)
  → POST /dispense → Flask queues command, sets status = "dispensing"
  → Blender polls GET /pending → receives command → plays animation (frames 1–120)
  → After 5s → Blender POST /status {"status":"complete"}
  → React polls GET /status → sees "complete"
  → EmailJS sends confirmation email
  → Green checkmark UI → auto-resets after 5 seconds
```

---

## EmailJS Templates

Two separate templates are required in your EmailJS dashboard:

**Template 1 — Caregiver Alert** (`VITE_EMAILJS_TEMPLATE_ID`)

```
Subject: Agastya Alert — {{patient_name}}

Variables used:
  {{caregiver_name}}, {{patient_name}}, {{medication_name}},
  {{alert_reason}}, {{message}}, {{timestamp}}
```

**Template 2 — Dispenser Confirmation** (`VITE_EMAILJS_DISPENSER_TEMPLATE_ID`)

```
Subject: Agastya — {{medication_name}} Dispensed

Hi {{to_name}},

Medication dispensed successfully.

Patient:    {{patient_name}}
Medication: {{medication_name}} {{dosage}}
Tray:       {{tray}}
Time:       {{dispensed_time}}
Status:     {{status}}

— Agastya AI
```

---

## Voice Output on Linux

Requires a TTS engine:

```bash
sudo pacman -S espeak-ng speech-dispatcher        # Arch Linux
systemctl --user enable --now speech-dispatcher
```

Restart the browser after installing.

---

## About

**Agastya** (आगस्त्य) is a revered sage in Indian tradition — a symbol of knowledge, care, and healing. This project was built to help elderly Indian patients manage multiple medications safely, with support for regional languages and caregivers who may not always be present.
