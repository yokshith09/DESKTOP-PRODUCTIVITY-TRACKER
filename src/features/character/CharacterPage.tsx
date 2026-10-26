import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/features/shell/PageHeader";
import { BEAR_POSES, Bear, type BearPose } from "@/features/shell/Bear";
import { BACK_TURN_SHAKE, playEmote, type EmoteRun } from "@/pet/emotes";
import { PetLibrary } from "./PetLibrary";
import { PackPreview } from "./PackPreview";
import { useQuery } from "@tanstack/react-query";
import { ipc } from "@/ipc";
import { NudgeSettings } from "@/features/settings/NudgeSettings";
import { CompanionPanel } from "@/features/companion/CompanionPanel";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSetting } from "@/hooks/useTheme";

const SIZES = { S: 64, M: 96, L: 128 } as const;

/** What each pose is for, as shown on the preview buttons. */
const POSE_LABELS: Record<BearPose, string> = {
  idle: "Idle", wave: "Hello (hover)", type: "Typing with you", wait: "Waiting for you", stow: "Laptop away", sleep: "Sleepy", work: "Working", cheer: "Task done", party: "All done",
  catch: "Task added", worried: "Worried", ring: "Reminder", toss: "Task deleted", jump: "Jump", sad: "Failed", review: "Reviewing",
  turn: "Three-quarter view", back: "Back view", back_look: "Looking back",
};

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function CharacterPage() {
  const [shown, setShown] = useState<string | null>(null);
  const { data: packs = [] } = useQuery({ queryKey: ["pets", "library"], queryFn: ipc.petsList });
  const shownPack = shown ? packs.find((p) => p.id === shown) : undefined;
  const [pose, setPose] = useState<BearPose>("idle");
  const [replay, setReplay] = useState(0);
  const [visible, setVisible] = useSetting("pet.visible");
  const [size, setSize] = useSetting("pet.size");
  const [opacity, setOpacity] = useSetting("pet.opacity");
  const [onTop, setOnTop] = useSetting("pet.always_on_top");
  const [typing, setTyping] = useSetting("pet.typing");
  const [hoverCard, setHoverCard] = useSetting("pet.hover_card");
  const px = SIZES[size ?? "M"];
  const emote = useRef<EmoteRun | null>(null);
  useEffect(() => () => emote.current?.cancel(), []);
  const playBackTurn = () => {
    emote.current?.cancel();
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    emote.current = playEmote(BACK_TURN_SHAKE, { restore: "idle", set: (p) => { setPose(p); setReplay((n) => n + 1); }, reducedMotion: reduced });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Character" description="Your desktop companion. It sits on your screen and stays out of the way." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel className="flex flex-col items-center justify-between gap-6 p-6">
          {shownPack ? <PackPreview key={shownPack.id} pack={shownPack} /> : (
            <>
          <div className="grid min-h-72 w-full flex-1 place-items-center rounded-lg border bg-muted/40 [background-image:radial-gradient(circle_at_center,var(--border)_1px,transparent_1px)] [background-size:16px_16px]">
            <Bear key={`${pose}-${replay}`} pose={pose} animated className="size-56" />
          </div>
          <div className="flex w-full items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Loaf the bear</p>
              <p className="text-xs text-muted-foreground">Default character</p>
            </div>
            <p className="text-xs text-muted-foreground">Pick a moment to preview it</p>
          </div>
          <div className="flex w-full flex-wrap gap-1.5" role="group" aria-label="Preview pose">
            {BEAR_POSES.map((p) => (
              <Button
                key={p} size="sm" variant={p === pose ? "default" : "outline"} aria-pressed={p === pose}
                onClick={() => { setPose(p); setReplay((n) => n + 1); }}
              >
                {POSE_LABELS[p]}
              </Button>
            ))}
            <Button size="sm" variant="secondary" onClick={playBackTurn}>Play back-turn shake</Button>
          </div>
            </>
          )}
        </Panel>

        <Panel className="divide-y px-5">
          <Row label="Show on desktop" hint="Hide the companion without quitting Loaf.">
            <Switch checked={visible ?? true} onCheckedChange={(v) => void setVisible(v)} aria-label="Show on desktop" />
          </Row>
          <Row label="Size" hint={`${px} px on screen`}>
            <ToggleGroup type="single" value={size ?? "M"} onValueChange={(v) => v && void setSize(v as "S" | "M" | "L")} aria-label="Size">
              <ToggleGroupItem value="S">S</ToggleGroupItem>
              <ToggleGroupItem value="M">M</ToggleGroupItem>
              <ToggleGroupItem value="L">L</ToggleGroupItem>
            </ToggleGroup>
          </Row>
          <Row label="Opacity" hint={`${opacity ?? 100}%`}>
            <Slider className="w-36" min={20} max={100} step={5} value={[opacity ?? 100]} onValueChange={([v]) => v !== undefined && void setOpacity(v)} aria-label="Opacity" />
          </Row>
          <Row label="Card when I hover the pet" hint="Today at a glance when you hover the pet. Off: the same facts (focus time left, the next task, the next reminder) come as a short bubble instead.">
            <Switch checked={hoverCard ?? true} onCheckedChange={(v) => void setHoverCard(v)} aria-label="Card when I hover the pet" />
          </Row>
          <Row label="Always on top" hint="Keep the companion above other windows.">
            <Switch checked={onTop ?? true} onCheckedChange={(v) => void setOnTop(v)} aria-label="Always on top" />
          </Row>
          <Row
            label="Type along with me"
            hint="When you type in any app, it takes out a laptop and types too, and waits while a text box is open. Loaf only counts key presses (never which keys) and checks whether a text box is focused (never what is in it). Nothing is saved or sent. On macOS, allow Input Monitoring, and Accessibility for the text-box part."
          >
            <Switch checked={typing ?? false} onCheckedChange={(v) => void setTyping(v)} aria-label="Type along with me" />
          </Row>
          <div className="py-4">
            <p className="mb-3 text-xs font-medium text-muted-foreground">Preview at each size</p>
            <div className="flex items-end gap-6">
              {(Object.entries(SIZES) as [string, number][]).map(([k, v]) => (
                <figure key={k} className="text-center" style={{ opacity: (opacity ?? 100) / 100 }}>
                  <Bear className="mx-auto" style={{ width: v, height: v }} />
                  <figcaption className="mt-1 text-[11px] text-muted-foreground">{k} · {v}px</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <PetLibrary shown={shownPack ? shown : null} onShow={setShown} />
      <div className="mt-6"><NudgeSettings /></div>
      <CompanionPanel />
    </div>
  );
}
