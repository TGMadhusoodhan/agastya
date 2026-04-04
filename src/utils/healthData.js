import { baseVitals } from '../data/mockVitals.js'

function vary(value, range = 0.05) {
  const delta = value * range * (Math.random() * 2 - 1)
  return Math.round((value + delta) * 10) / 10
}

export function getVitals() {
  return {
    heartRate: {
      ...baseVitals.heartRate,
      value: Math.round(vary(baseVitals.heartRate.value, 0.08)),
    },
    spO2: {
      ...baseVitals.spO2,
      value: Math.min(100, Math.round(vary(baseVitals.spO2.value, 0.02))),
    },
    stress: {
      ...baseVitals.stress,
      value: Math.round(vary(baseVitals.stress.value, 0.1)),
    },
    sleep: {
      ...baseVitals.sleep,
      value: Math.round(vary(baseVitals.sleep.value, 0.1) * 10) / 10,
    },
  }
}

export function getVitalsStatus(vital) {
  const { value, normal } = vital
  if (value < normal[0]) return 'low'
  if (value > normal[1]) return 'high'
  return 'normal'
}

export function getVitalsColor(status) {
  if (status === 'normal') return 'text-emerald-600'
  if (status === 'low') return 'text-sky-600'
  return 'text-red-500'
}
