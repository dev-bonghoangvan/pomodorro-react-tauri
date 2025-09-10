import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react'
import { createHtmlPortalNode, InPortal, OutPortal } from 'react-reverse-portal'

// Context để quản lý overlay
type OverlayContextType = {
  setAnchor: (element: HTMLElement | null) => void
  portalNode: any
  setVideoId: (id: string) => void
  currentVideoId: string
}

const OverlayContext = createContext<OverlayContextType>({
  setAnchor: () => {},
  portalNode: null,
  setVideoId: () => {},
  currentVideoId: ''
})

// Provider component
export function YouTubeOverlayProvider({ children }: { children: React.ReactNode }) {
  const portalNodeRef = useRef(createHtmlPortalNode())
  const [currentVideoId, setCurrentVideoId] = useState('YNDT833ahtc')
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)
  const [allAnchors, setAllAnchors] = useState<HTMLElement[]>([])
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    zIndex: 1000,
    pointerEvents: 'none'
  })

  // Update overlay position when anchor changes
  const updateOverlayPosition = useCallback(() => {
    if (allAnchors.length === 0) {
      setOverlayStyle(prev => ({ ...prev, width: 0, height: 0, opacity: 0 }))
      return
    }

    // Find the largest visible anchor element
    let bestAnchor = allAnchors[0]
    let bestArea = 0
    
    for (const anchor of allAnchors) {
      const rect = anchor.getBoundingClientRect()
      const area = rect.width * rect.height
      
      // Only consider elements that are visible and have reasonable size
      if (rect.width > 100 && rect.height > 100 && area > bestArea) {
        bestAnchor = anchor
        bestArea = area
      }
    }

    const rect = bestAnchor.getBoundingClientRect()
    console.log('YouTubeOverlay: Using best anchor', {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      area: bestArea,
      element: bestAnchor.className
    })
    
    setOverlayStyle({
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 1000,
      pointerEvents: 'auto',
      opacity: 1
    })
  }, [allAnchors])

  // Update position when anchor changes
  useEffect(() => {
    updateOverlayPosition()
  }, [updateOverlayPosition])

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      updateOverlayPosition()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateOverlayPosition])

  const setVideoId = useCallback((id: string) => {
    setCurrentVideoId(prev => prev === id ? prev : id)
  }, [])

  const setAnchor = useCallback((element: HTMLElement | null) => {
    if (element) {
      setAllAnchors(prev => {
        const newAnchors = prev.filter(anchor => anchor !== element)
        return [...newAnchors, element]
      })
    } else {
      setAllAnchors(prev => prev.filter(anchor => anchor !== element))
    }
  }, [])

  const url = (id: string) => {
    const p = new URLSearchParams({
      autoplay: '0', controls: '1', rel: '0', modestbranding: '1',
      playsinline: '1', iv_load_policy: '3', enablejsapi: '1',
    })
    return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`
  }

  return (
    <OverlayContext.Provider value={{ 
      setAnchor, 
      portalNode: portalNodeRef.current, 
      setVideoId, 
      currentVideoId 
    }}>
      {/* Single iframe - mounted once, never unmounted */}
      <InPortal node={portalNodeRef.current}>
        <div style={{ width: '100%', height: '100%' }}>
          <iframe
            key="youtube-player-single" // Fixed key - never changes
            src={url(currentVideoId)}
            style={{ 
              width: '100%', 
              height: '100%',
              border: 'none',
              display: 'block'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </InPortal>

      {/* Overlay container - positioned over anchor */}
      <div style={{
        ...overlayStyle,
        border: '2px solid red', // Debug border
        backgroundColor: 'rgba(255,0,0,0.1)' // Debug background
      }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          color: 'white', 
          fontSize: '12px', 
          background: 'red',
          padding: '2px',
          zIndex: 1001
        }}>
          DEBUG: {Math.round(Number(overlayStyle.width))}x{Math.round(Number(overlayStyle.height))}
        </div>
        <OutPortal node={portalNodeRef.current} />
      </div>

      {children}
    </OverlayContext.Provider>
  )
}

// Hook để sử dụng trong components
export function useYouTubeOverlay() {
  return useContext(OverlayContext)
}

// Component để đặt anchor
export function YouTubeAnchor({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { setAnchor } = useYouTubeOverlay()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAnchor(ref.current)
    return () => setAnchor(null)
  }, [setAnchor])

  return (
    <div 
      ref={ref} 
      className={className} 
      style={style}
    />
  )
}
