import { isTauri } from "../lib/utils";

// Collapsed and expanded widths for the MiniMode window
export const COLLAPSED_W = 320; // must match MiniMode main section width
export const EXPANDED_W = 640; // collapsed + settings panel width

/**
 * Toggle between collapsed and expanded window widths.
 * anchor = 'right' (default): grows to the right
 * anchor = 'left'            : keeps right edge fixed, grows leftwards
 */
export async function toggleExpand(anchor: "right" | "left" = "right") {
  if (!isTauri()) {
    console.log("[Browser mock] toggleExpand called outside Tauri");
    return;
  }
  try {
    const { LogicalPosition, LogicalSize } = await import("@tauri-apps/api/dpi");
    const { getCurrentWindow } = await import("@tauri-apps/api/window");

    const win = getCurrentWindow();

    const size = await win.outerSize(); // requires allow-outer-size
    const pos = await win.outerPosition(); // requires allow-outer-position

    const isCollapsed = size.width <= COLLAPSED_W + 2; // small tolerance
    const targetWidth = isCollapsed ? EXPANDED_W : COLLAPSED_W;
    const delta = targetWidth - size.width;

    if (anchor === "left" && delta > 0) {
      // Move window left first so right edge appears anchored
      await win.setPosition(new LogicalPosition(pos.x - delta, pos.y)); // allow-set-position
    }

    await win.setResizable(true); // allow-set-resizable
    await win.setSize(new LogicalSize(targetWidth, size.height)); // allow-set-size
  } catch (err) {
    console.error("toggleExpand failed:", err);
  }
}
