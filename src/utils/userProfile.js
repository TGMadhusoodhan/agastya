// src/utils/userProfile.js — Firestore user profile (language + prefs)
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './firebase.js'

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s — Firestore may not be enabled in your Firebase project`)), ms)
    ),
  ])

export async function saveUserProfile(uid, data) {
  await withTimeout(
    setDoc(doc(db, 'users', uid), data, { merge: true }),
    8000,
    'saveUserProfile'
  )
}

export async function loadUserProfile(uid) {
  try {
    const snap = await withTimeout(getDoc(doc(db, 'users', uid)), 8000, 'loadUserProfile')
    return snap.exists() ? snap.data() : null
  } catch {
    return null
  }
}
