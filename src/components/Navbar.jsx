// src/components/Navbar.jsx
import { useState } from 'react'
import { useT } from '../contexts/LanguageContext.jsx'
import {
  HomeIcon, CameraIcon, ClipboardIcon, CalendarIcon,
  PulseIcon, BarChartIcon, UserIcon, SettingsIcon, MenuIcon, XIcon,
} from './Icons.jsx'

const ICON_MAP = {
  home:          HomeIcon,
  scan:          CameraIcon,
  prescriptions: ClipboardIcon,
  schedule:      CalendarIcon,
  vitals:        PulseIcon,
  history:       BarChartIcon,
  profile:       UserIcon,
  settings:      SettingsIcon,
}

const TAB_IDS = ['home','scan','prescriptions','schedule','vitals','history','profile','settings']

export default function Navbar({ activeTab, onTabChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const t = useT()

  const TABS        = TAB_IDS.map(id => ({ id, label: t.nav[id] || id, Icon: ICON_MAP[id] }))
  const BOTTOM_MAIN = TABS.slice(0, 5)
  const BOTTOM_MORE = TABS.slice(5)

  const handleTab = (id) => { onTabChange(id); setMenuOpen(false) }

  return (
    <>
      {/* ── Top navbar ─────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1D56DB, #2563EB)', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
            >
              <span className="text-base font-black select-none" style={{ color: '#fff' }}>आ</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-lg leading-none" style={{ color: '#0F172A' }}>Agastya</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] leading-none mt-0.5" style={{ color: '#94A3B8' }}>
                AI MED SYSTEM
              </div>
            </div>
          </div>

          {/* Desktop tabs */}
          <div className="hidden lg:flex items-center gap-0.5">
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => handleTab(id)}
                  className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                  style={
                    active
                      ? { background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.15)' }
                      : { color: '#64748B', border: '1px solid transparent' }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {active && (
                    <span
                      className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full"
                      style={{ background: '#2563EB' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tablet icon tabs */}
          <div className="hidden md:flex lg:hidden items-center gap-0.5">
            {TABS.map(({ id, Icon, label }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => handleTab(id)}
                  title={label}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150"
                  style={
                    active
                      ? { background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.15)' }
                      : { color: '#94A3B8', border: '1px solid transparent' }
                  }
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ color: '#64748B', border: '1px solid #E2E8F0', background: '#fff' }}
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <XIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            className="md:hidden px-4 pb-4 pt-2"
            style={{ borderTop: '1px solid #E2E8F0', background: '#fff' }}
          >
            <div className="grid grid-cols-4 gap-2">
              {TABS.map(({ id, label, Icon }) => {
                const active = activeTab === id
                return (
                  <button
                    key={id}
                    onClick={() => handleTab(id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[11px] font-semibold transition-all"
                    style={
                      active
                        ? { background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }
                        : { color: '#64748B', border: '1px solid #F1F5F9', background: '#F8FAFC' }
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── Mobile bottom bar ─────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden z-50"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid #E2E8F0',
          boxShadow: '0 -1px 3px rgba(15,23,42,0.05)',
        }}
      >
        <div className="flex justify-around items-center h-16 px-2">
          {BOTTOM_MAIN.map(({ id, label, Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => handleTab(id)}
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all relative"
                style={{ color: active ? '#2563EB' : '#94A3B8' }}
              >
                {active && (
                  <span
                    className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 rounded-xl -z-10"
                    style={{ background: 'rgba(37,99,235,0.08)' }}
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold">{label}</span>
                {active && (
                  <div className="w-4 h-0.5 rounded-full" style={{ background: '#2563EB' }} />
                )}
              </button>
            )
          })}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all"
            style={{ color: BOTTOM_MORE.some(t => t.id === activeTab) ? '#2563EB' : '#94A3B8' }}
          >
            {menuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            <span className="text-[9px] font-bold">{t.nav.more}</span>
          </button>
        </div>

        {/* More popup */}
        {menuOpen && (
          <div
            className="absolute bottom-full left-0 right-0 px-6 py-4"
            style={{ background: '#fff', borderTop: '1px solid #E2E8F0', boxShadow: '0 -4px 16px rgba(15,23,42,0.08)' }}
          >
            <div className="flex justify-around">
              {BOTTOM_MORE.map(({ id, label, Icon }) => {
                const active = activeTab === id
                return (
                  <button
                    key={id}
                    onClick={() => handleTab(id)}
                    className="flex flex-col items-center gap-1.5 py-2 px-5 rounded-2xl transition-all"
                    style={
                      active
                        ? { background: 'rgba(37,99,235,0.08)', color: '#2563EB' }
                        : { color: '#64748B' }
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
