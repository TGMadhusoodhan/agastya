// src/components/AuthPage.jsx — Login / Signup page (dark glass, Agastya style)
import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../utils/firebase.js'

const inputStyle = {
  background: 'rgba(10,22,34,0.7)',
  border: '1px solid rgba(0,232,123,0.15)',
  color: '#EDFAF3',
  borderRadius: '0.875rem',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '0.9375rem',
  outline: 'none',
  transition: 'border-color 0.2s',
}

function PasswordStrength({ pw }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length
  const colors = ['#FF4D6A', '#FF4D6A', '#FFAD00', '#00E87B', '#00E87B']
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  if (!pw) return null
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all"
            style={{ background: i <= score ? colors[score] : 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  )
}

export default function AuthPage() {
  const [mode,    setMode]    = useState('login')   // 'login' | 'signup' | 'reset'
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [pw,      setPw]      = useState('')
  const [pwConf,  setPwConf]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [info,    setInfo]    = useState('')

  const clearMessages = () => { setError(''); setInfo('') }

  const friendlyError = (code) => {
    const map = {
      'auth/user-not-found':       'No account found with this email.',
      'auth/wrong-password':       'Incorrect password. Try again.',
      'auth/invalid-credential':   'Invalid email or password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Please enter a valid email address.',
      'auth/too-many-requests':    'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    }
    return map[code] || 'Something went wrong. Please try again.'
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw)
      // onAuthStateChanged in AuthContext handles the rest
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    clearMessages()
    if (!name.trim()) { setError('Please enter your full name.'); return }
    if (pw !== pwConf) { setError('Passwords do not match.'); return }
    if (pw.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pw)
      await updateProfile(cred.user, { displayName: name.trim() })
      await sendEmailVerification(cred.user)
      setInfo(`Account created! A verification email was sent to ${email.trim()}.`)
      // User is now logged in — App.jsx will receive the auth state update
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setInfo(`Password reset email sent to ${email.trim()}. Check your inbox.`)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => { setMode(m); clearMessages(); setPw(''); setPwConf('') }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#060C10' }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,232,123,0.06) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl font-black mx-auto mb-4"
            style={{ background: 'rgba(10,22,34,0.8)', border: '1px solid rgba(0,232,123,0.25)', boxShadow: '0 0 40px rgba(0,232,123,0.1)', backdropFilter: 'blur(20px)' }}
          >
            <span style={{ color: '#00E87B', textShadow: '0 0 20px rgba(0,232,123,0.6)' }}>आ</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#00E87B' }}>Agastya</h1>
          <p className="text-xs mt-1 font-semibold uppercase tracking-widest" style={{ color: '#3D5E52' }}>
            AI Medication Intelligence
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-7 space-y-5"
          style={{ background: 'rgba(10,22,34,0.85)', border: '1px solid rgba(0,232,123,0.12)', backdropFilter: 'blur(24px)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
        >
          {/* Title */}
          <div>
            <h2 className="text-xl font-black" style={{ color: '#EDFAF3' }}>
              {mode === 'login'  ? 'Welcome back'    :
               mode === 'signup' ? 'Create account'  :
                                   'Reset password'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#3D5E52' }}>
              {mode === 'login'  ? 'Sign in to your Agastya account'      :
               mode === 'signup' ? 'Set up your personal medication AI'   :
                                   'Enter your email and we\'ll send a link'}
            </p>
          </div>

          {/* Error / Info banners */}
          {error && (
            <div className="rounded-2xl px-4 py-3 text-sm font-medium"
              style={{ background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.25)', color: '#FF4D6A' }}>
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-2xl px-4 py-3 text-sm font-medium"
              style={{ background: 'rgba(0,232,123,0.07)', border: '1px solid rgba(0,232,123,0.2)', color: '#00E87B' }}>
              {info}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleReset}
            className="space-y-4"
          >
            {/* Name — signup only */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#3D5E52' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,232,123,0.4)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,232,123,0.15)' }}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#3D5E52' }}>
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,232,123,0.4)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(0,232,123,0.15)' }}
              />
            </div>

            {/* Password — not on reset */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#3D5E52' }}>
                  Password
                </label>
                <input
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,232,123,0.4)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,232,123,0.15)' }}
                />
                {mode === 'signup' && <PasswordStrength pw={pw} />}
              </div>
            )}

            {/* Confirm password — signup only */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#3D5E52' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={pwConf}
                  onChange={e => setPwConf(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0,232,123,0.4)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,232,123,0.15)' }}
                />
                {pwConf && pw !== pwConf && (
                  <p className="mt-1 text-xs" style={{ color: '#FF4D6A' }}>Passwords do not match</p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-50 mt-1"
              style={{
                background: loading ? 'rgba(0,200,100,0.4)' : 'linear-gradient(135deg,#00C864,#00E87B)',
                color: '#04100A',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(0,232,123,0.25)',
              }}
            >
              {loading
                ? (mode === 'login' ? 'Signing in…' : mode === 'signup' ? 'Creating account…' : 'Sending…')
                : (mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email')
              }
            </button>
          </form>

          {/* Footer links */}
          <div className="text-center space-y-2 pt-1">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => switchMode('reset')}
                  className="block w-full text-xs font-semibold transition-all"
                  style={{ color: '#3D5E52' }}
                  onMouseEnter={e => { e.target.style.color = '#00E87B' }}
                  onMouseLeave={e => { e.target.style.color = '#3D5E52' }}
                >
                  Forgot your password?
                </button>
                <p className="text-sm" style={{ color: '#3D5E52' }}>
                  No account?{' '}
                  <button onClick={() => switchMode('signup')} className="font-bold transition-all" style={{ color: '#00E87B' }}>
                    Sign up
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-sm" style={{ color: '#3D5E52' }}>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="font-bold" style={{ color: '#00E87B' }}>
                  Sign in
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <button onClick={() => switchMode('login')} className="text-sm font-bold" style={{ color: '#00E87B' }}>
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#1E3329' }}>
          Knowledge · Care · Intelligence
        </p>
      </div>
    </div>
  )
}
