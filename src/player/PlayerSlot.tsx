import React from 'react'
import { OutPortal } from 'react-reverse-portal'
import { useYouTube } from './YouTubeProvider'

interface PlayerSlotProps {
  className?: string;
  style?: React.CSSProperties;
}

export function PlayerSlot({ className, style }: PlayerSlotProps) {
  const { portalNode } = useYouTube()

  return (
    <div 
      className={className} 
      style={{ 
        ...style, 
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      <OutPortal node={portalNode} />
    </div>
  )
}
