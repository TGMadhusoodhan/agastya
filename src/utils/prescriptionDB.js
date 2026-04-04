import { openDB } from 'idb'

const DB_NAME = 'agastya-db'
const DB_VERSION = 1

let dbPromise = null

async function initDB() {
  if (dbPromise) return dbPromise
  try {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('prescriptions')) {
          const prescStore = db.createObjectStore('prescriptions', {
            keyPath: 'id',
            autoIncrement: true,
          })
          prescStore.createIndex('date', 'date')
          prescStore.createIndex('doctor', 'doctorName')
          prescStore.createIndex('condition', 'conditionCategory')
          prescStore.createIndex('status', 'status')
        }
        if (!db.objectStoreNames.contains('activeMedications')) {
          const medStore = db.createObjectStore('activeMedications', {
            keyPath: 'id',
            autoIncrement: true,
          })
          medStore.createIndex('slot', 'slot')
          medStore.createIndex('expiryDate', 'expiryDate')
          medStore.createIndex('autoExpire', 'autoExpire')
        }
      },
    })
    return dbPromise
  } catch (err) {
    console.error('IndexedDB init failed, falling back to localStorage:', err)
    return null
  }
}

// localStorage fallback helpers
const LS_PRESC_KEY = 'agastya_prescriptions'
const LS_MEDS_KEY = 'agastya_activeMeds'

function lsGet(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}
function lsSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('localStorage write failed:', e)
  }
}

export async function savePrescription(prescriptionData, imageBlob) {
  try {
    const db = await initDB()
    const today = new Date().toISOString().split('T')[0]
    const hasActiveMeds = prescriptionData.medications?.some(
      (m) => !m.expiryDate || new Date(m.expiryDate) > new Date()
    )
    const record = {
      ...prescriptionData,
      savedAt: new Date().toISOString(),
      status: hasActiveMeds ? 'active' : 'expired',
      imageBlob: imageBlob || null,
    }

    if (db) {
      const id = await db.add('prescriptions', record)
      return { ...record, id }
    } else {
      const all = lsGet(LS_PRESC_KEY)
      const id = Date.now()
      const saved = { ...record, id }
      all.push(saved)
      lsSet(LS_PRESC_KEY, all)
      return saved
    }
  } catch (err) {
    console.error('savePrescription error:', err)
    throw err
  }
}

export async function getAllPrescriptions() {
  try {
    const db = await initDB()
    if (db) {
      const all = await db.getAll('prescriptions')
      return all.sort((a, b) => new Date(b.date) - new Date(a.date))
    } else {
      const all = lsGet(LS_PRESC_KEY)
      return all.sort((a, b) => new Date(b.date) - new Date(a.date))
    }
  } catch (err) {
    console.error('getAllPrescriptions error:', err)
    return []
  }
}

export async function getPrescriptionById(id) {
  try {
    const db = await initDB()
    if (db) {
      return await db.get('prescriptions', id)
    } else {
      return lsGet(LS_PRESC_KEY).find((p) => p.id === id) || null
    }
  } catch (err) {
    console.error('getPrescriptionById error:', err)
    return null
  }
}

export async function deletePrescription(id) {
  try {
    const db = await initDB()
    if (db) {
      await db.delete('prescriptions', id)
      const meds = await db.getAllFromIndex('activeMedications', 'slot')
      // remove meds from this prescription
      const all = await db.getAll('activeMedications')
      for (const med of all) {
        if (med.prescriptionId === id) {
          await db.delete('activeMedications', med.id)
        }
      }
    } else {
      const prescs = lsGet(LS_PRESC_KEY).filter((p) => p.id !== id)
      lsSet(LS_PRESC_KEY, prescs)
      const meds = lsGet(LS_MEDS_KEY).filter((m) => m.prescriptionId !== id)
      lsSet(LS_MEDS_KEY, meds)
    }
  } catch (err) {
    console.error('deletePrescription error:', err)
    throw err
  }
}

export async function getActiveMedications() {
  try {
    const db = await initDB()
    if (db) {
      return await db.getAll('activeMedications')
    } else {
      return lsGet(LS_MEDS_KEY)
    }
  } catch (err) {
    console.error('getActiveMedications error:', err)
    return []
  }
}

export async function addMedicationToDispenser(medication) {
  try {
    const db = await initDB()
    const record = {
      ...medication,
      addedAt: new Date().toISOString(),
      paused: false,
    }
    if (db) {
      const id = await db.add('activeMedications', record)
      return { ...record, id }
    } else {
      const all = lsGet(LS_MEDS_KEY)
      const id = Date.now() + Math.random()
      const saved = { ...record, id }
      all.push(saved)
      lsSet(LS_MEDS_KEY, all)
      return saved
    }
  } catch (err) {
    console.error('addMedicationToDispenser error:', err)
    throw err
  }
}

export async function removeMedicationFromDispenser(id) {
  try {
    const db = await initDB()
    if (db) {
      await db.delete('activeMedications', id)
    } else {
      const all = lsGet(LS_MEDS_KEY).filter((m) => m.id !== id)
      lsSet(LS_MEDS_KEY, all)
    }
  } catch (err) {
    console.error('removeMedicationFromDispenser error:', err)
    throw err
  }
}

export async function checkAndExpireMedications() {
  try {
    const db = await initDB()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expired = []

    if (db) {
      const all = await db.getAll('activeMedications')
      for (const med of all) {
        if (med.autoExpire && med.expiryDate) {
          const expiry = new Date(med.expiryDate)
          expiry.setHours(0, 0, 0, 0)
          if (expiry <= today) {
            await db.delete('activeMedications', med.id)
            expired.push(`${med.name} ${med.dosage || ''}`.trim())
          }
        }
      }
    } else {
      const all = lsGet(LS_MEDS_KEY)
      const remaining = []
      for (const med of all) {
        if (med.autoExpire && med.expiryDate) {
          const expiry = new Date(med.expiryDate)
          expiry.setHours(0, 0, 0, 0)
          if (expiry <= today) {
            expired.push(`${med.name} ${med.dosage || ''}`.trim())
            continue
          }
        }
        remaining.push(med)
      }
      lsSet(LS_MEDS_KEY, remaining)
    }
    return expired
  } catch (err) {
    console.error('checkAndExpireMedications error:', err)
    return []
  }
}

export async function toggleAutoExpire(medicationId, value) {
  try {
    const db = await initDB()
    if (db) {
      const med = await db.get('activeMedications', medicationId)
      if (med) {
        med.autoExpire = value
        await db.put('activeMedications', med)
      }
    } else {
      const all = lsGet(LS_MEDS_KEY).map((m) =>
        m.id === medicationId ? { ...m, autoExpire: value } : m
      )
      lsSet(LS_MEDS_KEY, all)
    }
  } catch (err) {
    console.error('toggleAutoExpire error:', err)
  }
}

export async function extendMedicationExpiry(medicationId, extraDays) {
  try {
    const db = await initDB()
    if (db) {
      const med = await db.get('activeMedications', medicationId)
      if (med && med.expiryDate) {
        const d = new Date(med.expiryDate)
        d.setDate(d.getDate() + extraDays)
        med.expiryDate = d.toISOString().split('T')[0]
        await db.put('activeMedications', med)
        return med
      }
    } else {
      let updated = null
      const all = lsGet(LS_MEDS_KEY).map((m) => {
        if (m.id === medicationId && m.expiryDate) {
          const d = new Date(m.expiryDate)
          d.setDate(d.getDate() + extraDays)
          updated = { ...m, expiryDate: d.toISOString().split('T')[0] }
          return updated
        }
        return m
      })
      lsSet(LS_MEDS_KEY, all)
      return updated
    }
  } catch (err) {
    console.error('extendMedicationExpiry error:', err)
  }
}

export async function updateMedicationInDispenser(id, updates) {
  try {
    const db = await initDB()
    if (db) {
      const med = await db.get('activeMedications', id)
      if (med) {
        const updated = { ...med, ...updates }
        await db.put('activeMedications', updated)
        return updated
      }
    } else {
      let updated = null
      const all = lsGet(LS_MEDS_KEY).map((m) => {
        if (m.id === id) {
          updated = { ...m, ...updates }
          return updated
        }
        return m
      })
      lsSet(LS_MEDS_KEY, all)
      return updated
    }
  } catch (err) {
    console.error('updateMedicationInDispenser error:', err)
  }
}
