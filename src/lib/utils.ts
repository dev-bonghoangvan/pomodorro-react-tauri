import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Seconds -> "MM:SS" */
export const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** Safely calls a Tauri command, with fallback when in browser */
export async function safeInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T | null> {
  if (!isTauri()) {
    console.warn(`[Browser mock] invoke('${cmd}') called outside Tauri:`, args);
    if (cmd === "is_autostart_enabled") return false as unknown as T;
    return null;
  }
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<T>(cmd, args);
  } catch (error) {
    console.error(`Error invoking '${cmd}':`, error);
    return null;
  }
}

/** Safely close the window */
export async function closeWindow() {
  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("close_window");
    } catch (e) {
      console.error("Failed to close window:", e);
    }
  } else {
    console.log("[Browser mock] Window close requested");
  }
}

/** Safely minimize the window */
export async function minimizeWindow() {
  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("minimize_window");
    } catch (e) {
      console.error("Failed to minimize window:", e);
    }
  } else {
    console.log("[Browser mock] Window minimize requested");
  }
}