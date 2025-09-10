import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize, LogicalPosition } from "@tauri-apps/api/dpi";

// Collapsed and expanded widths for the MiniMode window
export const COLLAPSED_W = 280; // must match MiniMode main section width
export const EXPANDED_W = 520; // collapsed + settings panel width

/**
 * Toggle between collapsed and expanded window widths.
 * anchor = 'right' (default): grows to the right
 * anchor = 'left'            : keeps right edge fixed, grows leftwards
 */
export async function toggleExpand(anchor: "right" | "left" = "right") {
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
}
