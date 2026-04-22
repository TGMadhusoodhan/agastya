// src/utils/reconcileApi.js — cache + orchestration for Agastya Reconcile
import { getActivePrescriptionsForReconcile } from './prescriptionDB.js'
import { reconcileAllPrescriptions } from './claudeApi.js'

const LS_KEY = 'agastya_reconcile_cache'
const CACHE_TTL_MS = 4 * 60 * 60 * 1000  // 4 hours

function loadCache() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.analyzedAt) return null
    if (Date.now() - new Date(parsed.analyzedAt).getTime() > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function saveCache(result) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(result)) } catch {}
}

export function getCachedReconcile() {
  return loadCache()
}

export function clearReconcileCache() {
  try { localStorage.removeItem(LS_KEY) } catch {}
}

export async function runReconcile(patient, { force = false } = {}) {
  if (!force) {
    const cached = loadCache()
    if (cached) return cached
  }
  const prescriptions = await getActivePrescriptionsForReconcile()
  const result = await reconcileAllPrescriptions(prescriptions, patient)
  saveCache(result)
  return result
}
