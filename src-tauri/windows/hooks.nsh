; Installer hooks for the Windows setup program (referenced from tauri.conf.json).
;
; Pluto used to be called Loaf. A different name is a different program to Windows, so installing
; Pluto left the old Loaf installed and, if it was running, still running: two pets, two copies
; of the app, and a login entry for each. This removes the old one when Pluto is installed.
;
;   * It only does anything when an old Loaf is registered (nothing for a new install, and
;     nothing on an update from one Pluto to the next).
;   * Loaf's own uninstaller does the removal, silently. That keeps the person's data: the
;     uninstaller deletes the data folder only when its "Delete app data" box is ticked, and a
;     silent run never ticks it. Pluto then copies that data across on its first start
;     (`pluto_core::legacy_data`), so nothing has to be done by hand.
;   * The old program is stopped first so the uninstaller isn't waiting on it.

!macro NSIS_HOOK_PREINSTALL
  Push $R0
  Push $R1
  Push $R2

  ReadRegStr $R0 SHCTX "Software\Microsoft\Windows\CurrentVersion\Uninstall\Loaf" "UninstallString"
  ${If} $R0 != ""
    DetailPrint "Removing the earlier version (Loaf). Your notes, tasks and settings are kept."
    nsExec::Exec 'taskkill /F /IM loaf.exe'
    Pop $R2
    Sleep 800

    ; Run the old uninstaller in place (`_?=`) so this waits for it, then tidy up what it
    ; cannot delete from itself: the same steps Tauri's own reinstall page takes.
    ReadRegStr $R1 SHCTX "${MANUKEY}\Loaf" ""
    ${If} $R1 != ""
      ExecWait '$R0 /S _?=$R1' $R2
      Delete "$R1\uninstall.exe"
      RMDir "$R1"
    ${Else}
      ExecWait '$R0 /S' $R2
    ${EndIf}

    ; Its login entry, in case the uninstaller left it.
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Loaf"
  ${EndIf}

  Pop $R2
  Pop $R1
  Pop $R0
!macroend
