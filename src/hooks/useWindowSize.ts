import { useState, useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { LogicalSize, getCurrentWindow } from '@tauri-apps/api/window'

export type DisplayMode = 'mini' | 'compact' | 'tall' | 'full'

export interface WindowSize {
  width: number
  height: number
  mode: DisplayMode
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({ width: 300, height: 200, mode: 'mini' })

  useEffect(() => {
    // Get initial size
    const getInitialSize = async () => {
      try {
        const window = getCurrentWindow()
        const logicalSize = await window.innerSize()
        const width = logicalSize.width
        const height = logicalSize.height
        const mode = determineMode(width, height)
        setSize({ width, height, mode })
      } catch (error) {
        console.error('Error getting initial window size:', error)
      }
    }

    getInitialSize()

    // Listen for window resize events
    const unlisten = listen('tauri://resize', (event) => {
      try {
        const payload = event.payload as { width: number; height: number }
        const width = payload.width
        const height = payload.height
        const mode = determineMode(width, height)
        setSize({ width, height, mode })
      } catch (error) {
        console.error('Error handling resize event:', error)
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  return size
}

function determineMode(width: number, height: number): DisplayMode {
  // Calculate aspect ratio
  const ar = width / Math.max(1, height);
  
  // Ưu tiên chiều nào chật hơn
  if (height <= 100 || width <= 340) {
    return 'mini'
  } else if (height <= 260 || width <= 520) {
    return 'compact'
  } else if (ar < 1 && height > 420) {
    // Trường hợp "cao và hẹp" -> bố cục dọc
    return 'tall'
  } else {
    return 'full'
  }
}
