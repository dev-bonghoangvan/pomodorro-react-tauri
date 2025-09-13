!macro preInit
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  SetRegView 32
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
!macroend

!macro customInstall
  ; Tạo page tùy chỉnh cho Start with Windows
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW StartWithWindowsPageShow
  !define MUI_PAGE_CUSTOMFUNCTION_LEAVE StartWithWindowsPageLeave
  
  ; Thêm page vào installer
  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_LICENSE "license.txt"
  !insertmacro MUI_PAGE_DIRECTORY
  Page custom StartWithWindowsPage
  !insertmacro MUI_PAGE_INSTFILES
  !insertmacro MUI_PAGE_FINISH
  
  ; Variables
  Var StartWithWindowsCheckbox
  
  ; Function để hiển thị page Start with Windows
  Function StartWithWindowsPage
    !insertmacro MUI_HEADER_TEXT "Start with Windows" "Choose whether to start Pomodoro Vibe Spotify with Windows"
    
    nsDialogs::Create 1018
    Pop $0
    
    ; Tạo checkbox
    ${NSD_CreateCheckbox} 0 0 100% 20u "Start Pomodoro Vibe Spotify with Windows"
    Pop $StartWithWindowsCheckbox
    
    ; Check mặc định
    ${NSD_Check} $StartWithWindowsCheckbox
    
    ; Thêm text mô tả
    ${NSD_CreateLabel} 0 25u 100% 30u "This will add the application to Windows startup so it launches automatically when you log in."
    Pop $0
    
    nsDialogs::Show
  FunctionEnd
  
  ; Function khi page được hiển thị
  Function StartWithWindowsPageShow
    ; Có thể thêm logic khác ở đây
  FunctionEnd
  
  ; Function khi rời khỏi page
  Function StartWithWindowsPageLeave
    ${NSD_GetState} $StartWithWindowsCheckbox $0
    ${If} $0 == ${BST_CHECKED}
      ; Thêm vào Windows startup registry
      WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "PomodoroVibeSpotify" "$INSTDIR\pomodoro-tauri-spotify.exe"
    ${EndIf}
  FunctionEnd
!macroend

!macro customUnInstall
  ; Xóa khỏi Windows startup khi uninstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "PomodoroVibeSpotify"
!macroend
