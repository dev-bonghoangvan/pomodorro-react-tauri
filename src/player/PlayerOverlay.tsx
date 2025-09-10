// player/PlayerOverlay.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { OutPortal } from 'react-reverse-portal'
import { useYouTube } from './YouTubeProvider'

type Box = { left: number; top: number; width: number; height: number } | null
const PlayerBoxCtx = createContext<{ setAnchorEl: (el: HTMLElement | null) => void }>({ setAnchorEl: () => {} })

export function usePlayerAnchor() {
  return useContext(PlayerBoxCtx).setAnchorEl
}

// Overlay luôn sống, đặt ngoài AnimatePresence
export function PlayerOverlayProvider({ children }: { children: React.ReactNode }) {
  const { portalNode } = useYouTube()
  const [box, setBox] = useState<Box>(null)
  const anchorRef = useRef<HTMLElement | null>(null)

  const measure = useCallback(() => {
    if (!anchorRef.current) {
      return setBox(null)
    }
    const r = anchorRef.current.getBoundingClientRect()
    setBox({ left: r.left, top: r.top, width: r.width, height: r.height })
  }, [])

  const setAnchorEl = useCallback((el: HTMLElement | null) => {
    anchorRef.current = el
    if (el) {
      requestAnimationFrame(measure)
    }
    // Không set box về null khi anchor bị remove
    // Chỉ đo lại khi có anchor mới
  }, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])


  return (
    <PlayerBoxCtx.Provider value={{ setAnchorEl }}>
      {/* Overlay cố định, không bị animation của mode ảnh hưởng */}
      {box && (
        <div
          style={{
            position: 'fixed',
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            zIndex: 60,           // cao hơn UI chung
            pointerEvents: 'auto' // cho phép click trong iframe
          }}
        >
          <OutPortal node={portalNode} />
        </div>
      )}
      {children}
    </PlayerBoxCtx.Provider>
  )
}
