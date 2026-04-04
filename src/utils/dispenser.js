const DISPENSER_URL = 'http://localhost:5000'

export async function triggerDispenser(compartment, drug, dose) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${DISPENSER_URL}/dispense`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compartment,
        drug,
        dose,
        timestamp: new Date().toISOString(),
      }),
    })

    clearTimeout(timer)

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, ...data }
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, offline: true, message: 'Dispenser timed out' }
    }
    return { success: false, offline: true, message: 'Dispenser offline — medication not dispensed' }
  }
}

export async function checkDispenserHealth() {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${DISPENSER_URL}/health`, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error('unhealthy')
    return await res.json()
  } catch {
    return { status: 'offline', dispenser: 'unreachable' }
  }
}

export async function getDispenserLog() {
  try {
    const res = await fetch(`${DISPENSER_URL}/log`)
    if (!res.ok) throw new Error('failed')
    return await res.json()
  } catch {
    return []
  }
}
