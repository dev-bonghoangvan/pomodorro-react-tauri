import React from 'react'
import { useYouTube } from '../player/YouTubeProvider'

export function VideoDebug() {
  const { currentVideoId } = useYouTube()
  
  return (
    <div className="fixed top-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-[100]">
      <div>Video ID: {currentVideoId}</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
    </div>
  )
}
