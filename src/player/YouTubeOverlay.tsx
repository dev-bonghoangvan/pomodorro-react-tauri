import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react'
import { createHtmlPortalNode, InPortal, OutPortal } from 'react-reverse-portal'

// Loop config type
export interface LoopConfig {
  loopCount: number
  loopEnabled: boolean
  loopPortion: boolean
  portionLoopCount?: number
  startTime: number // seconds
  endTime: number // seconds
}

// Context để quản lý overlay
type OverlayContextType = {
  setAnchor: (element: HTMLElement | null) => void
  portalNode: any
  setVideoId: (id: string) => void
  currentVideoId: string
  videoDuration: number
  player: any
  loopConfig: LoopConfig | null
  setLoopConfig: (config: LoopConfig | null) => void
  playedTimes: number
  resetPlayedTimes: () => void
}

const OverlayContext = createContext<OverlayContextType>({
  setAnchor: () => {},
  portalNode: null,
  setVideoId: () => {},
  currentVideoId: '',
  videoDuration: 0,
  player: null,
  loopConfig: null,
  setLoopConfig: () => {},
  playedTimes: 0,
  resetPlayedTimes: () => {},
})

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    __ytPlayer?: any;
  }
}

// Provider component
export function YouTubeOverlayProvider({ children }: { children: React.ReactNode }) {
  const portalNodeRef = useRef(createHtmlPortalNode())
  const [currentVideoId, setCurrentVideoId] = useState('YNDT833ahtc')
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)
  const [allAnchors, setAllAnchors] = useState<HTMLElement[]>([])
  const [videoDuration, setVideoDuration] = useState(0)
  const [loopConfig, setLoopConfig] = useState<LoopConfig | null>(null)
  const [playedTimes, setPlayedTimes] = useState(0)
  const playedTimesRef = useRef(0)
  const loopConfigRef = useRef<LoopConfig | null>(null)
  loopConfigRef.current = loopConfig
  const resetPlayedTimes = useCallback(() => {
    playedTimesRef.current = 0
    setPlayedTimes(0)
  }, [])
  const [isMiniAnchor, setIsMiniAnchor] = useState(false)
  const playerRef = useRef<any>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const playerReadyRef = useRef(false)
  const pendingVideoIdRef = useRef<string | null>(null)
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    zIndex: 30,
    pointerEvents: 'none',
    overflow: 'hidden',
    borderRadius: '10px',
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
    
    const isMini = rect.width <= 50 || rect.height <= 50
    setIsMiniAnchor(isMini)
    
    setOverlayStyle(prev => ({
      ...prev,
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      zIndex: 30,
      pointerEvents: 'auto',
      overflow: 'hidden',
      borderRadius: isMini ? '8px' : '10px',
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

  // Load YouTube IFrame API
  useEffect(() => {
    console.log('Checking YouTube IFrame API...', { 
      hasYT: !!window.YT, 
      hasPlayer: !!(window.YT && window.YT.Player) 
    })
    
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      console.log('✅ YouTube IFrame API already loaded')
      return
    }

    console.log('Loading YouTube IFrame API script...')
    // Load the IFrame API script
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.onload = () => {
      console.log('YouTube IFrame API script loaded')
    }
    tag.onerror = () => {
      console.error('Failed to load YouTube IFrame API script')
    }
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Set up callback
    window.onYouTubeIframeAPIReady = () => {
      console.log('✅ YouTube IFrame API ready callback fired!')
    }
  }, [])

  // Helper function to get and update duration with retry
  const getDurationWithRetry = useCallback((player: any) => {
    let attempts = 0
    const maxAttempts = 5
    
    const tryGetDuration = () => {
      try {
        const duration = player.getDuration()
        if (duration && duration > 0 && !isNaN(duration) && isFinite(duration)) {
          setVideoDuration(duration)
          const h = Math.floor(duration / 3600)
          const m = Math.floor((duration % 3600) / 60)
          const s = duration % 60
          console.log(`✅ Duration: ${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} (${duration}s)`)
          return
        }
      } catch (e) {
        // Ignore
      }
      
      attempts++
      if (attempts < maxAttempts) {
        setTimeout(tryGetDuration, 1000)
      }
    }
    
    tryGetDuration()
  }, [])

  // Initialize YouTube Player
  useEffect(() => {
    let iframeCheck: ReturnType<typeof setInterval> | null = null
    let apiCheck: ReturnType<typeof setInterval> | null = null

    const init = () => {
      if (iframeCheck) clearInterval(iframeCheck)
      
      iframeCheck = setInterval(() => {
        const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
        
        if (iframe && !playerRef.current) {
          try {
            playerRef.current = new window.YT.Player(iframe, {
              events: {
                onReady: (e: any) => {
                  console.log('✅ Player ready')
                  playerReadyRef.current = true
                  try {
                    window.__ytPlayer = e.target
                  } catch {}
                  getDurationWithRetry(e.target)
                  
                  // Load pending video if any
                  if (pendingVideoIdRef.current) {
                    const vid = pendingVideoIdRef.current
                    pendingVideoIdRef.current = null
                    console.log('🔄 Loading pending:', vid)
                    e.target.loadVideoById(vid)
                    setTimeout(() => getDurationWithRetry(e.target), 1500)
                  }
                },
                onStateChange: (e: any) => {
                  try {
                    const dur = e.target.getDuration()
                    if (dur > 0) setVideoDuration(dur)
                  } catch {}

                  // Handle native video ENDED (state === 0)
                  if (e.data === 0) {
                    const cfg = loopConfigRef.current
                    if (cfg?.loopEnabled && !cfg?.loopPortion) {
                      const next = playedTimesRef.current + 1
                      playedTimesRef.current = next
                      setPlayedTimes(next)
                      console.log(`🔁 Entire video loop #${next}/${cfg.loopCount || 10}`)
                      if (next < (cfg.loopCount || 10)) {
                        e.target.seekTo(0, true)
                        e.target.playVideo()
                      } else {
                        console.log(`✅ Completed entire video loop ${cfg.loopCount} times`)
                        setLoopConfig(prev => prev ? { ...prev, loopEnabled: false } : null)
                      }
                    }
                  }
                }
              }
            })
            iframeRef.current = iframe
            try {
              window.__ytPlayer = playerRef.current
            } catch {}
            if (iframeCheck) clearInterval(iframeCheck)
          } catch (e) {
            console.error('Player init error:', e)
          }
        }
      }, 500)
    }

    if (!window.YT?.Player) {
      apiCheck = setInterval(() => {
        if (window.YT?.Player) {
          if (apiCheck) clearInterval(apiCheck)
          init()
        }
      }, 100)
    } else {
      init()
    }

    return () => {
      if (iframeCheck) clearInterval(iframeCheck)
      if (apiCheck) clearInterval(apiCheck)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle video ID changes - use cueVideoById to avoid autoplay, then get duration
  useEffect(() => {
    if (!currentVideoId) return
    
    console.log('🔄 Video ID changed:', currentVideoId)
    
    // Reset duration and loop config for new video
    setVideoDuration(0)
    setLoopConfig(null)
    console.log('🔄 Reset loopConfig for new video')
    
    // If player not ready, save for later
    if (!playerRef.current || !playerReadyRef.current) {
      console.log('⏳ Player not ready, saving pending:', currentVideoId)
      pendingVideoIdRef.current = currentVideoId
      return
    }
    
    // Player is ready, load video
    console.log('✅ Loading video:', currentVideoId)
    try {
      // Use cueVideoById to load without autoplay
      playerRef.current.cueVideoById(currentVideoId)
      
      // Get duration with retry
      let attempts = 0
      const maxAttempts = 8
      
      const tryGetDuration = () => {
        try {
          const dur = playerRef.current?.getDuration()
          console.log(`Attempt ${attempts + 1}/${maxAttempts}: duration =`, dur)
          
          if (dur && dur > 0 && !isNaN(dur) && isFinite(dur)) {
            setVideoDuration(dur)
            const h = Math.floor(dur / 3600)
            const m = Math.floor((dur % 3600) / 60)
            const s = Math.floor(dur % 60)
            console.log(`✅ New duration: ${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} (${dur}s)`)
            return
          }
        } catch (e) {
          console.warn('Error getting duration:', e)
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(tryGetDuration, 1000)
        } else {
          console.error('❌ Failed to get duration after', maxAttempts, 'attempts')
        }
      }
      
      // Start trying after a delay to allow video to load
      setTimeout(tryGetDuration, 1500)
    } catch (e) {
      console.error('Error loading video:', e)
    }
  }, [currentVideoId])

  // Active playback loop controller (for portion looping and continuous enforcement)
  useEffect(() => {
    if (!loopConfig || (!loopConfig.loopPortion && !loopConfig.loopEnabled)) {
      playedTimesRef.current = 0
      setPlayedTimes(0)
      return
    }

    // Reset played times on new configuration
    playedTimesRef.current = 0
    setPlayedTimes(0)

    const player = playerRef.current
    if (player && loopConfig.loopPortion && typeof player.getCurrentTime === 'function') {
      try {
        const cur = player.getCurrentTime()
        if (cur < loopConfig.startTime || (loopConfig.endTime > loopConfig.startTime && cur >= loopConfig.endTime)) {
          console.log(`🎯 Jumping to start of portion: ${loopConfig.startTime}s`)
          player.seekTo(loopConfig.startTime, true)
        }
      } catch (err) {}
    }

    const interval = setInterval(() => {
      const p = playerRef.current
      if (!p || typeof p.getCurrentTime !== 'function') return

      try {
        const state = p.getPlayerState?.()
        // 1 = PLAYING, 3 = BUFFERING
        if (state !== 1 && state !== 3) return

        const current = p.getCurrentTime()

        // 1. Portion loop check
        if (loopConfig.loopPortion) {
          const { startTime, endTime, portionLoopCount = 5 } = loopConfig
          if (endTime > startTime && current >= endTime) {
            const nextCount = playedTimesRef.current + 1
            playedTimesRef.current = nextCount
            setPlayedTimes(nextCount)
            console.log(`🔁 Portion loop #${nextCount}/${portionLoopCount}: reached ${current.toFixed(1)}s >= ${endTime}s -> seeking back to ${startTime}s`)

            if (nextCount < portionLoopCount) {
              p.seekTo(startTime, true)
              p.playVideo?.()
            } else {
              console.log(`🎉 Finished portion loop ${portionLoopCount} times! Pausing video.`)
              p.seekTo(endTime, true)
              p.pauseVideo?.()
              setLoopConfig(prev => prev ? { ...prev, loopPortion: false } : null)
            }
          }
        }

        // 2. Entire video loop near-end fallback
        if (loopConfig.loopEnabled && !loopConfig.loopPortion) {
          const dur = p.getDuration?.()
          const { loopCount = 10 } = loopConfig
          if (dur > 0 && current >= dur - 0.5) {
            const nextCount = playedTimesRef.current + 1
            playedTimesRef.current = nextCount
            setPlayedTimes(nextCount)
            console.log(`🔁 Full video loop #${nextCount}/${loopCount}`)
            if (nextCount < loopCount) {
              p.seekTo(0, true)
              p.playVideo?.()
            } else {
              p.pauseVideo?.()
              setLoopConfig(prev => prev ? { ...prev, loopEnabled: false } : null)
            }
          }
        }
      } catch (e) {}
    }, 200)

    return () => clearInterval(interval)
  }, [
    loopConfig?.loopPortion,
    loopConfig?.startTime,
    loopConfig?.endTime,
    loopConfig?.portionLoopCount,
    loopConfig?.loopEnabled,
    loopConfig?.loopCount,
  ])

  return (
    <OverlayContext.Provider value={{ 
      setAnchor, 
      portalNode: portalNodeRef.current, 
      setVideoId, 
      currentVideoId,
      videoDuration,
      player: playerRef.current,
      loopConfig,
      setLoopConfig,
      playedTimes,
      resetPlayedTimes
    }}>
      {/* Single iframe - mounted once, never unmounted */}
      <InPortal node={portalNodeRef.current}>
          <iframe
            key="youtube-player" // Keep same key to preserve player instance
            src={url(currentVideoId)}
            style={{ 
              width: isMiniAnchor ? '250%' : '100%', 
              height: isMiniAnchor ? '250%' : '100%',
              transform: isMiniAnchor ? 'scale(0.4)' : 'none',
              transformOrigin: 'top left',
              border: 'none',
              display: 'block',
              borderRadius: isMiniAnchor ? '8px' : '10px',
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
