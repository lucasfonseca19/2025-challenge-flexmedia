import { useEffect } from 'react'
import { FONTS } from '../constants/fonts'

const loadedFonts = new Set<string>()
const pendingFonts = new Map<string, Promise<void>>()

export function useFontLoader(fontFamily: string) {
  useEffect(() => {
    const font = FONTS.find(f => f.id === fontFamily)
    if (!font) return

    if (loadedFonts.has(font.id)) return

    if (pendingFonts.has(font.id)) {
      pendingFonts.get(font.id)!.then(() => {
        document.documentElement.style.setProperty('--active-font', `'${font.id}', system-ui, sans-serif`)
      })
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = font.href

    const promise = new Promise<void>((resolve) => {
      link.onload = () => {
        loadedFonts.add(font.id)
        pendingFonts.delete(font.id)
        document.documentElement.style.setProperty('--active-font', `'${font.id}', system-ui, sans-serif`)
        resolve()
      }
      link.onerror = () => {
        pendingFonts.delete(font.id)
        document.documentElement.style.setProperty('--active-font', `system-ui, sans-serif`)
        resolve()
      }
    })

    pendingFonts.set(font.id, promise)
    document.head.appendChild(link)

    return () => {
      document.documentElement.style.removeProperty('--active-font')
    }
  }, [fontFamily])
}

export function getFontStack(fontId: string): string {
  const font = FONTS.find(f => f.id === fontId)
  if (!font) return 'system-ui, sans-serif'
  return `'${font.id}', system-ui, sans-serif`
}