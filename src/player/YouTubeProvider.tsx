// player/YouTubeProvider.tsx
import React, { createContext, useContext, useMemo, useRef, useState, useCallback } from 'react'
import { createHtmlPortalNode, InPortal } from 'react-reverse-portal'

type Ctx = { portalNode: any; setVideoId: (id: string) => void; currentVideoId: string }
const Ctx = createContext<Ctx>({ portalNode: null, setVideoId: () => {}, currentVideoId: '' })

const url = (id: string) => {
  const p = new URLSearchParams({
    autoplay: '0', controls: '1', rel: '0', modestbranding: '1',
    playsinline: '1', iv_load_policy: '3', enablejsapi: '1',
  })
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`
}

export function YouTubeProvider({ children }: { children: React.ReactNode }) {
  const portalNodeRef = useRef(createHtmlPortalNode())
  const [currentVideoId, setCurrentVideoId] = useState('YNDT833ahtc')
  const setVideoId = useCallback((id: string) => setCurrentVideoId(prev => prev === id ? prev : id), [])
  const src = useMemo(() => url(currentVideoId), [currentVideoId])


  return (
    <>
      <InPortal node={portalNodeRef.current}>
        <iframe
          key="youtube-player" // Fixed key to prevent unmounting
          src={src}
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
      </InPortal>
      <Ctx.Provider value={{ portalNode: portalNodeRef.current, setVideoId, currentVideoId }}>
        {children}
      </Ctx.Provider>
    </>
  )
}
export const useYouTube = () => useContext(Ctx)
