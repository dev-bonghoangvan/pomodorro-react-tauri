import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export type DisplayMode = "mini" | "small" | "compact" | "tall" | "full";

export interface WindowSize {
  width: number;
  height: number;
  mode: DisplayMode;
}

type Limits = {
  minW: number;
  minH: number;
  maxW?: number;   // đặt khi muốn khóa chặt range
  maxH?: number;   // để trống là "không giới hạn"
};

// Gợi ý ngưỡng (tweak tùy app của bạn)
const LIMITS: Record<DisplayMode, Limits> = {
  mini:    { minW: 260, minH: 90,  maxW: 360, maxH: 140 },
  small:   { minW: 360, minH: 170, maxW: 480, maxH: 260 },
  compact: { minW: 480, minH: 220 /*, maxW: 720, maxH: 420 */ },
  tall:    { minW: 360, minH: 420 /* chỉ đặt min, cho phép cao hơn */ },
  full:    { minW: 640, minH: 760 /* tăng min height để chuyển sang tall mode khi nhỏ hơn */ },
};

// Đệm để chống nhảy mode khi lắc chuột resize
const HYSTERESIS = 12;

function pickMode(width: number, height: number, prev?: DisplayMode): DisplayMode {
  const ar = width / Math.max(1, height);

  // Ưu tiên width cho mini/compact, height + AR cho tall
  if (width <= 340 + (prev === "mini" ? HYSTERESIS : 0) || height <= 100 + (prev === "mini" ? HYSTERESIS : 0)) {
    return "mini";
  }
  if (width <= 480 + (prev === "small" ? HYSTERESIS : 0) && height <= 260 + (prev === "small" ? HYSTERESIS : 0)) {
    return "small";
  }
  if (width <= 720 + (prev === "compact" ? HYSTERESIS : 0) || height <= 400 + (prev === "compact" ? HYSTERESIS : 0)) {
    return "compact";
  }
  // Nếu height < 760px thì chuyển sang tall mode thay vì full mode
  if (height < 760 - (prev === "tall" ? HYSTERESIS : 0)) {
    return "tall";
  }
  if (ar < 1 && height >= 420 - (prev === "tall" ? HYSTERESIS : 0) && width <= 540 + (prev === "tall" ? HYSTERESIS : 0)) {
    return "tall";
  }
  return "full";
}

async function applyLimits(mode: DisplayMode) {
  const win = getCurrentWindow();
  const l = LIMITS[mode];

  // Min size luôn nên đặt
  await win.setMinSize({ width: l.minW, height: l.minH } as any);

  // Max size: chỉ đặt khi muốn "khóa" chặt (mini/small), còn lại nên bỏ để user kéo thoải mái
  if (typeof l.maxW === "number" && typeof l.maxH === "number") {
    await win.setMaxSize({ width: l.maxW, height: l.maxH } as any);
  } else {
    await win.setMaxSize(null); // bỏ giới hạn max
  }
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({ width: 300, height: 200, mode: "mini" });

  useEffect(() => {
    const win = getCurrentWindow();

    // Init
    win.innerSize().then(({ width, height }) => {
      const mode = pickMode(width, height);
      setSize({ width, height, mode });
      applyLimits(mode);
    });

    // Dùng onResized có payload chuẩn, đỡ phải tự parse event
    let raf = 0;
    const unlistenPromise = win.onResized(({ payload: { width, height } }) => {
      // throttle nhẹ bằng rAF để tránh spam setState
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setSize(prev => {
          const mode = pickMode(width, height, prev.mode);
          if (mode !== prev.mode) {
            // đổi mode -> cập nhật min/max tương ứng
            applyLimits(mode);
          }
          return { width, height, mode };
        });
      });
    });

    return () => { unlistenPromise.then(off => off()); };
  }, []);

  return size;
}
