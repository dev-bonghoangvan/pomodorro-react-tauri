import React, { createContext, useContext, useMemo, useRef, useState, useCallback } from 'react'
import { createHtmlPortalNode, InPortal } from 'react-reverse-portal'

type Ctx = {
  portalNode: any
  setVideoId: (id: string) => void
  currentVideoId: string
}

const PlayerCtx = createContext<Ctx>({ portalNode: null, setVideoId: () => {}, currentVideoId: '' })

const ytUrl = (id: string) => {
  const p = new URLSearchParams({
    autoplay: '0',
    controls: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    iv_load_policy: '3',
    enablejsapi: '1', // nếu sau này muốn điều khiển qua JS API
  })
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`
}

export function YouTubeProvider({ children }: { children: React.ReactNode }) {
  // portal node cố định suốt vòng đời app
  const portalNodeRef = useRef(createHtmlPortalNode())
  const [currentVideoId, setCurrentVideoId] = useState('YNDT833ahtc')

  const setVideoId = useCallback((id: string) => {
    setCurrentVideoId(prev => (prev === id ? prev : id))
  }, [])

  const src = useMemo(() => ytUrl(currentVideoId), [currentVideoId])

  return (
    <>
      <InPortal node={portalNodeRef.current}>
        <iframe
          src={src}
          style={{ width: '100%', height: '100%' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </InPortal>

      <PlayerCtx.Provider value={{ portalNode: portalNodeRef.current, setVideoId, currentVideoId }}>
        {children}
      </PlayerCtx.Provider>
    </>
  )
}

export function useYouTube() {
  return useContext(PlayerCtx)
}
