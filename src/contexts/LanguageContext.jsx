import { createContext, useContext } from 'react'
import { getT } from '../utils/i18n.js'

const LanguageContext = createContext('English')

export default LanguageContext

// Hook — returns the full translations object for the current language
export function useT() {
  const lang = useContext(LanguageContext)
  return getT(lang)
}

// Hook — returns just the current language string
export function useLang() {
  return useContext(LanguageContext)
}
