import { useEffect, useState, type RefObject } from 'react';

export interface DropdownPositionOptions {
  width?: number;
  gap?: number;
  align?: 'start' | 'end' | 'center';
}

export interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'bottom' | 'top';
}

export function useDropdownPosition(
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  options?: DropdownPositionOptions
): DropdownPosition | null {
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const el = triggerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const gap = options?.gap ?? 8;
      const targetWidth = options?.width ?? 440;
      const width = Math.min(targetWidth, Math.max(280, window.innerWidth - 24));

      let left: number;
      if (options?.align === 'start') {
        left = rect.left;
      } else if (options?.align === 'center') {
        left = rect.left + rect.width / 2 - width / 2;
      } else {
        // default 'end': align popover's right edge with button's right edge
        left = rect.right - width;
      }

      // Clamp horizontal within screen boundaries
      if (left < 12) left = 12;
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - width - 12);
      }

      // Vertical position calculation
      const winH = window.innerHeight;
      let top: number;
      let maxHeight: number;
      let placement: 'bottom' | 'top' = 'bottom';

      if (winH < 340) {
        // Short window: pin inside viewport with margin
        top = 8;
        maxHeight = winH - 16;
        placement = 'bottom';
      } else {
        const spaceBelow = winH - rect.bottom - gap - 12;
        const spaceAbove = rect.top - gap - 12;

        if (spaceBelow >= 300 || spaceBelow >= spaceAbove) {
          top = rect.bottom + gap;
          maxHeight = Math.max(200, spaceBelow);
          placement = 'bottom';
        } else {
          placement = 'top';
          maxHeight = Math.max(200, Math.min(spaceAbove, 480));
          top = Math.max(12, rect.top - gap - maxHeight);
        }
      }

      setPosition({
        top: Math.round(top),
        left: Math.round(left),
        width: Math.round(width),
        maxHeight: Math.round(maxHeight),
        placement,
      });
    };

    // Calculate immediately and also after next frame in case of layout shifts
    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef, options?.width, options?.gap, options?.align]);

  return position;
}
