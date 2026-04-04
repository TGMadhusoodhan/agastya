// src/components/Navbar.jsx
import { useState } from 'react'
import { useT } from '../contexts/LanguageContext.jsx'

// ── Inline SVG icons — render consistently on all platforms ─────────────
const Icons = {
  scan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  prescriptions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  vitals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="6"  x2="6"  y2="18"/>
      <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
  ),
}

const TAB_IDS = ['scan','prescriptions','schedule','vitals','history','profile','settings']

export default function Navbar({ activeTab, onTabChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const t = useT()

  const TABS = TAB_IDS.map(id => ({ id, label: t.nav[id] }))
  const BOTTOM_MAIN = TABS.slice(0, 5)
  const BOTTOM_MORE = TABS.slice(5)

  const handleTab = (id) => {
    onTabChange(id)
    setMenuOpen(false)
  }

  return (
    <>
      {/* ── Top navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1E3A5F] via-[#1a4a72] to-[#0EA5E9] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow">
              <span className="text-white text-lg font-bold select-none">आ</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-white font-bold text-lg">Agastya</div>
              <div className="text-white/50 text-[10px]">Knowledge · Care · Intelligence</div>
            </div>
          </div>

          {/* Desktop tabs (lg+) */}
          <div className="hidden lg:flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-white text-[#1E3A5F] shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
              >
                <span className={activeTab === tab.id ? 'text-[#1E3A5F]' : 'text-white/80'}>
                  {Icons[tab.id]}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tablet icon-only tabs (md–lg) */}
          <div className="hidden md:flex lg:hidden items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                title={tab.label}
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-white text-[#1E3A5F] shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
              >
                {Icons[tab.id]}
                {activeTab === tab.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 rounded-xl hover:bg-white/10 transition"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu"
          >
            {menuOpen ? Icons.close : Icons.menu}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-[#152d4a] border-t border-white/10 px-4 pb-4 pt-3">
            <div className="grid grid-cols-4 gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTab(tab.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all
                    ${activeTab === tab.id
                      ? 'bg-white text-[#1E3A5F]'
                      : 'text-white/70 hover:bg-white/10'
                    }`}
                >
                  <span className={activeTab === tab.id ? 'text-[#1E3A5F]' : 'text-white/70'}>
                    {Icons[tab.id]}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ── Mobile bottom bar ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-1">
          {BOTTOM_MAIN.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all
                ${activeTab === tab.id ? 'text-[#0EA5E9]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {Icons[tab.id]}
              <span className="text-[9px] font-medium">{tab.label}</span>
              {activeTab === tab.id && <div className="w-4 h-0.5 bg-[#0EA5E9] rounded-full" />}
            </button>
          ))}

          {/* "More" button for profile + settings */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all
              ${BOTTOM_MORE.some(t => t.id === activeTab) ? 'text-[#0EA5E9]' : 'text-gray-400'}`}
          >
            {menuOpen ? Icons.close : Icons.menu}
            <span className="text-[9px] font-medium">{t.nav.more}</span>
          </button>
        </div>

        {/* More popup */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl px-6 py-4">
            <div className="flex justify-around">
              {BOTTOM_MORE.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTab(tab.id)}
                  className={`flex flex-col items-center gap-1.5 py-2 px-5 rounded-xl transition-all
                    ${activeTab === tab.id ? 'text-[#0EA5E9] bg-sky-50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  {Icons[tab.id]}
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
