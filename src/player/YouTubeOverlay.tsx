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
    pointerEvents: 'none',
    transition: 'all 0.2s ease-out'
  })

  // Update overlay position when anchor changes
  const updateOverlayPosition = useCallback(() => {
    console.log('YouTubeOverlay: updateOverlayPosition called', { 
      anchorsCount: allAnchors.length,
      anchors: allAnchors.map(a => ({
        className: a.className,
        rect: a.getBoundingClientRect()
      }))
    })
    
    if (allAnchors.length === 0) {
      setOverlayStyle(prev => ({ ...prev, width: 0, height: 0, opacity: 0 }))
      return
    }

    // Find the best visible anchor element
    let bestAnchor = allAnchors[0]
    let bestScore = 0
    
    for (const anchor of allAnchors) {
      const rect = anchor.getBoundingClientRect()
      const area = rect.width * rect.height
      
      // Calculate score based on visibility and size
      // Prioritize elements that are visible and have reasonable size
      let score = 0
      
      if (rect.width > 0 && rect.height > 0) {
        // Base score for visible elements
        score = area
        
        // Bonus for larger elements (but don't exclude small ones completely)
        if (rect.width > 50 && rect.height > 50) {
          score *= 1.5 // 50% bonus for larger elements
        } else if (rect.width > 20 && rect.height > 20) {
          score *= 1.2 // 20% bonus for medium elements
        }
        // Small elements (like MiniMode w-8 h-8 = 32x32px) get base score
        
        // Penalty for elements that are too small (less than 16x16)
        if (rect.width < 16 || rect.height < 16) {
          score *= 0.1
        }
      }
      
      if (score > bestScore) {
        bestAnchor = anchor
        bestScore = score
      }
    }

    // Fallback: if no suitable anchor found, use the first one
    if (bestScore === 0) {
      bestAnchor = allAnchors[0]
    }

    const rect = bestAnchor.getBoundingClientRect()
    console.log('YouTubeOverlay: Using best anchor', {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      score: bestScore,
      element: bestAnchor.className,
      allAnchors: allAnchors.map(a => ({
        className: a.className,
        rect: a.getBoundingClientRect(),
        area: a.getBoundingClientRect().width * a.getBoundingClientRect().height
      }))
    })
    
    setOverlayStyle(prev => ({
      ...prev,
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 1000,
      pointerEvents: 'auto',
      opacity: 1
    }))
  }, [allAnchors])

  // Update position when anchor changes
  useEffect(() => {
    updateOverlayPosition()
  }, [updateOverlayPosition])

  // Additional effect to handle layout changes with debounce
  useEffect(() => {
    let timeoutId: number
    
    const handleLayoutChange = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateOverlayPosition, 50)
    }
    
    // Listen for custom resize events
    window.addEventListener('resize', handleLayoutChange)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleLayoutChange)
    }
  }, [updateOverlayPosition])

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      updateOverlayPosition()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateOverlayPosition])

  // Fix height for div bọc iframe
  useEffect(() => {
    const fixIframeContainer = () => {
      // Tìm div bọc iframe trong overlay container
      const iframe = document.querySelector('iframe[src*="youtube"]')
      if (iframe && iframe.parentElement) {
        iframe.parentElement.style.height = '100%'
        iframe.parentElement.style.width = '100%'
        iframe.parentElement.style.display = 'flex'
        iframe.parentElement.style.flexDirection = 'column'
      }
    }

    // Fix immediately
    fixIframeContainer()

    // Fix after any DOM changes
    const observer = new MutationObserver(fixIframeContainer)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

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
          <iframe
            key="youtube-player-single" // Fixed key - never changes
            src={url(currentVideoId)}
            style={{ 
              width: '100%', 
              height: '100%',
              border: 'none',
              display: 'block',
              borderRadius: '10px',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
      </InPortal>

      {/* Overlay container - positioned over anchor */}
      <div style={overlayStyle}>
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
