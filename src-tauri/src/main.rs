#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager};

#[tauri::command]
fn set_always_on_top(app: AppHandle, on: bool) -> Result<(), String> {
  let window = app.get_webview_window("main").ok_or("Window not found")?;
  window.set_always_on_top(on).map_err(|e| e.to_string())
}

#[tauri::command]
#[cfg(windows)]
fn is_autostart_enabled() -> Result<bool, String> {
  use winreg::enums::*;
  use winreg::RegKey;
  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let path = r"Software\Microsoft\Windows\CurrentVersion\Run";
  if let Ok(key) = hkcu.open_subkey_with_flags(path, KEY_READ) {
    let val: Result<String, _> = key.get_value("PomodoroTauri");
    return Ok(val.is_ok());
  }
  Ok(false)
}

#[tauri::command]
#[cfg(not(windows))]
fn is_autostart_enabled() -> Result<bool, String> {
  Ok(false)
}

#[tauri::command]
#[cfg(windows)]
fn set_autostart(enable: bool) -> Result<(), String> {
  use std::env;
  use winreg::enums::*;
  use winreg::RegKey;

  let exe = env::current_exe().map_err(|e| e.to_string())?;
  let exe_str = exe.to_string_lossy().to_string();

  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let path = r"Software\Microsoft\Windows\CurrentVersion\Run";
  let (key, _) = hkcu.create_subkey(path).map_err(|e| e.to_string())?;

  if enable {
    key.set_value("PomodoroTauri", &exe_str).map_err(|e| e.to_string())?;
  } else {
    let _ = key.delete_value("PomodoroTauri");
  }
  Ok(())
}

#[tauri::command]
#[cfg(not(windows))]
fn set_autostart(_enable: bool) -> Result<(), String> {
  Err("Autostart chỉ hỗ trợ trên Windows trong bản mẫu này.".into())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      set_always_on_top,
      set_autostart,
      is_autostart_enabled
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}