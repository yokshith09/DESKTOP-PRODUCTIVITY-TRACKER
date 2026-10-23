import { PageHeader } from "@/features/shell/PageHeader";
import { isMac, mod } from "@/lib/platform";
import { DataSection } from "./DataSection";
import { NudgeSettings } from "./NudgeSettings";
import { Row, Section } from "./parts";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { errorMessage, ipc } from "@/ipc";
import { GLOBAL_SHORTCUTS, PET_SHORTCUT } from "./shortcuts";
import { Keys, ShortcutRow } from "./ShortcutRow";
import { useSetting } from "@/hooks/useTheme";

/** The main projects Loaf ships with and their licenses (About › Open-source software). */
const LICENSES: [string, string][] = [
  ["Tauri", "MIT or Apache-2.0"], ["Rust standard library", "MIT or Apache-2.0"], ["Tokio", "MIT"], ["rusqlite / SQLite", "MIT / public domain"],
  ["serde", "MIT or Apache-2.0"], ["chrono", "MIT or Apache-2.0"], ["tracing", "MIT"], ["React", "MIT"],
  ["TanStack Query", "MIT"], ["Radix UI", "MIT"], ["Tailwind CSS", "MIT"], ["lucide icons", "ISC"],
  ["dnd kit", "MIT"], ["react-markdown / remark-gfm", "MIT"], ["class-variance-authority", "Apache-2.0"], ["clsx, tailwind-merge", "MIT"],
];

export function SettingsPage() {
  const [theme, setTheme] = useSetting("general.theme");
  const [font, setFont] = useSetting("general.font_size");
  const [autostart, setAutostart] = useSetting("general.autostart");
  const [tracking, setTracking] = useSetting("tracking.apps");
  const [excluded, setExcluded] = useSetting("tracking.exclude_apps");
  const [sites, setSites] = useSetting("tracking.sites");
  const [safari, setSafari] = useSetting("tracking.safari");
  const [petVisible, setPetVisible] = useSetting("pet.visible");
  const [petSize, setPetSize] = useSetting("pet.size");
  const [petOpacity, setPetOpacity] = useSetting("pet.opacity");
  const [exclText, setExclText] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [openGlobal] = useSetting("shortcuts.global_open");
  const [noteGlobal] = useSetting("shortcuts.global_new_note");
  const globals: Record<string, string | null | undefined> = { "shortcuts.global_open": openGlobal, "shortcuts.global_new_note": noteGlobal };
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" />
      <Section title="Appearance">
        <Row label="Theme" hint="System follows your operating system.">
          <ToggleGroup type="single" value={theme ?? "dark"} onValueChange={(v) => v && void setTheme(v as "system" | "light" | "dark")} aria-label="Theme">
            <ToggleGroupItem value="system">System</ToggleGroupItem>
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label="Text size">
          <ToggleGroup type="single" value={font ?? "M"} onValueChange={(v) => v && void setFont(v as "S" | "M" | "L")} aria-label="Text size">
            <ToggleGroupItem value="S">Small</ToggleGroupItem>
            <ToggleGroupItem value="M">Default</ToggleGroupItem>
            <ToggleGroupItem value="L">Large</ToggleGroupItem>
          </ToggleGroup>
        </Row>
      </Section>
      <Section title="General">
        <Row label="Open Loaf at login" hint="Starts quietly in the tray.">
          <Switch checked={autostart ?? false} onCheckedChange={(v) => void setAutostart(v)} aria-label="Open Loaf at login" />
        </Row>
      </Section>
      <Section title="Notifications">
        <Row
          label="Reminder alerts"
          hint="A due reminder shows a system notification, flashes Loaf in the taskbar and makes the pet ring. Nothing showed up? Turn notifications on for Loaf and switch off Do not disturb (Focus) in your system settings."
        >
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Button
              size="sm" variant="secondary"
              onClick={() => void ipc.notificationTest().then(
                () => notify.info("Test sent. If no notification appeared, open the notification settings."),
                () => notify.error("Loaf couldn't show a notification."),
              )}
            >
              Send a test notification
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void ipc.notificationSettingsOpen().catch(() => notify.error("Open your system settings to manage notifications."))}>
              Open notification settings
            </Button>
          </div>
        </Row>
      </Section>
      <NudgeSettings />
      <Section title="Desktop pet">
        <Row label="Show the pet" hint={`Loaf the bear sits on your desktop. Click to open Loaf, double-click to hide it, right-click for options, drag to move. ${mod}+Shift+P shows or hides it.`}>
          <Switch checked={petVisible ?? true} onCheckedChange={(v) => void setPetVisible(v)} aria-label="Show the pet" />
        </Row>
        <Row label="Size">
          <ToggleGroup type="single" value={petSize ?? "M"} onValueChange={(v) => v && void setPetSize(v as "S" | "M" | "L")} aria-label="Pet size">
            <ToggleGroupItem value="S">Small</ToggleGroupItem>
            <ToggleGroupItem value="M">Medium</ToggleGroupItem>
            <ToggleGroupItem value="L">Large</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label="Opacity" hint={`${petOpacity ?? 100}%`}>
          <input
            type="range" min={30} max={100} step={5} value={petOpacity ?? 100} aria-label="Pet opacity"
            onChange={(e) => void setPetOpacity(Number(e.target.value))} className="w-40 accent-[var(--primary)]"
          />
        </Row>
      </Section>
      <Section title="Keyboard shortcuts">
        {GLOBAL_SHORTCUTS.map((g) => (
          <ShortcutRow
            key={g.key} settingKey={g.key} label={g.label} fallback={g.fallback}
            taken={[PET_SHORTCUT, ...GLOBAL_SHORTCUTS.filter((o) => o.key !== g.key).map((o) => globals[o.key] ?? o.fallback)]}
          />
        ))}
        <Row label="Show or hide the pet, from any app"><Keys combo={PET_SHORTCUT} /></Row>
        {[
          [`${mod}+1 … 5`, "Today overview, Tasks, Notes, Time, Meetings"],
          [`${mod}+T / ${mod}+M`, "New task / new meeting"],
          [`${mod}+K / ${mod}+N`, "Search notes / new note (on Notes)"],
          [`${mod}+,`, "Settings"],
        ].map(([keys, what]) => (
          <Row key={keys} label={what ?? ""}><span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-[12px]">{keys}</span></Row>
        ))}
      </Section>
      <Section title="Privacy and tracking">
        <Row label="Track app usage" hint="Records which app is in front, and for how long, to show where your time went. Stays on this computer. Window titles and full web addresses are never stored.">
          <Switch checked={tracking ?? false} onCheckedChange={(v) => void setTracking(v)} aria-label="Track app usage" />
        </Row>
        <Row
          label="Track websites (domain only)"
          hint="Reads the address bar of the browser in front and keeps only the site's name, like github.com. Private and incognito windows are skipped. Needs app tracking on. On a Mac: Chrome, Edge, Brave, Vivaldi and Arc (macOS asks once per browser) and Firefox (from its own session file, about 15 s behind); Safari only with the switch below."
        >
          <Switch checked={sites ?? false} disabled={!tracking} onCheckedChange={(v) => void setSites(v)} aria-label="Track websites" />
        </Row>
        {isMac && (
          <Row
            label="Include Safari"
            hint="Safari can't tell Loaf whether a window is private, so a private window's site would be counted too. Off unless you turn it on."
          >
            <Switch checked={safari ?? false} disabled={!tracking || !sites} onCheckedChange={(v) => void setSafari(v)} aria-label="Include Safari" />
          </Row>
        )}
        <div className="py-3.5">
          <label htmlFor="excluded" className="text-[13px] font-medium">Never track these apps</label>
          <p className="mb-2 text-xs text-muted-foreground">One per line, for example “1Password.exe”.</p>
          <textarea
            id="excluded" rows={3} value={exclText ?? (excluded ?? []).join("\n")}
            onChange={(e) => setExclText(e.target.value)}
            onBlur={() => { if (exclText !== null) { void setExcluded(exclText.split("\n").map((x) => x.trim()).filter(Boolean)); setExclText(null); } }}
            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Row label="Delete tracked time" hint="Removes every recorded app and site session.">
          <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>Delete…</Button>
        </Row>
      </Section>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="max-w-sm gap-3 p-5">
          <DialogTitle className="text-base font-semibold">Delete all tracked time?</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">Your notes, tasks and reminders are not affected. This can’t be undone.</DialogDescription>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => void ipc.usageDelete(null, null).then(() => { setConfirm(false); notify.info("Tracked time deleted"); })}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
      <DataSection />
      <Section title="Advanced">
        {/* Log rows removed (FR-47, owner V2-07): logging stays on for bug reports, it is just not shown. */}
        <Row label="Reset settings" hint="Every setting on this page back to its default. Your notes, tasks, meetings and layout stay.">
          {confirmReset ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>Keep</Button>
              <Button size="sm" variant="destructive" onClick={() => void ipc.settingsReset().then(() => { setConfirmReset(false); notify.info("Settings are back to their defaults"); }, (e: unknown) => notify.error(errorMessage(e)))}>Reset</Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setConfirmReset(true)}>Reset settings…</Button>
          )}
        </Row>
      </Section>
      <Section title="About">
        <Row label="Loaf" hint={`Version ${__APP_VERSION__} · Your notes, tasks and reminders are stored only on this computer.`}>
          <span />
        </Row>
        <details className="py-3.5 text-[13px]">
          <summary className="cursor-pointer font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring">Open-source software</summary>
          <p className="mt-2 text-xs text-muted-foreground">Loaf is built on these projects, used under their licenses:</p>
          <ul className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
            {LICENSES.map(([name, license]) => <li key={name}><span className="text-foreground">{name}</span> · {license}</li>)}
          </ul>
        </details>
      </Section>
    </div>
  );
}
