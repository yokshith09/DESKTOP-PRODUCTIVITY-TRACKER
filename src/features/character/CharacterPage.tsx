import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/features/shell/PageHeader";
import { BEAR_POSES, Bear, type BearPose } from "@/features/shell/Bear";
import { BACK_TURN_SHAKE, playEmote, type EmoteRun } from "@/pet/emotes";
import { CHARACTERS, CHARACTER_POSES, type CharacterPose } from "./Characters";
import { TURNED_VIEWS } from "./CharacterViews";
import { PetLibrary } from "./PetLibrary";
import type { TurnedPose } from "@/features/shell/BearViews";
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

/** One built-in character with its own back-turn shake preview (personal-photo characters never get one). */
function CharacterCard({ id, name, what, Component }: { id: keyof typeof TURNED_VIEWS; name: string; what: string; Component: (typeof CHARACTERS)[number]["Component"] }) {
  const [view, setView] = useState<TurnedPose | null>(null);
  const run = useRef<EmoteRun | null>(null);
  useEffect(() => () => run.current?.cancel(), []);
  const Turned = TURNED_VIEWS[id];
  const play = () => {
    run.current?.cancel();
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    run.current = playEmote<"front">(BACK_TURN_SHAKE, { restore: "front", set: (p) => setView(p === "front" ? null : p), reducedMotion: reduced });
  };
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{name} <span className="font-normal text-muted-foreground">{what}</span></p>
        <Button size="sm" variant="secondary" onClick={play}>Play back-turn shake</Button>
      </div>
      {view ? (
        <figure className="mt-2 text-center">
          <Turned key={view} pose={view} animated className="mx-auto size-20" />
          <figcaption className="text-[10px] text-muted-foreground">turned</figcaption>
        </figure>
      ) : (
        <div className="mt-2 grid grid-cols-5 gap-1">
          {CHARACTER_POSES.map((p: CharacterPose) => (
            <figure key={p} className="text-center">
              <Component pose={p} animated className="mx-auto size-20" />
              <figcaption className="text-[10px] text-muted-foreground">{p === "type" ? "typing" : p === "wait" ? "waiting" : p}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </Panel>
  );
}

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
  const [pose, setPose] = useState<BearPose>("idle");
  const [replay, setReplay] = useState(0);
  const [visible, setVisible] = useSetting("pet.visible");
  const [size, setSize] = useSetting("pet.size");
  const [opacity, setOpacity] = useSetting("pet.opacity");
  const [onTop, setOnTop] = useSetting("pet.always_on_top");
  const [typing, setTyping] = useSetting("pet.typing");
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
      <PetLibrary />
      <section aria-label="More characters" className="mt-6">
        <h2 className="text-[15px] font-semibold">More characters <span className="ml-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary">Preview</span></h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Coming in a later version. Each one types along with you, cheers when you finish, and naps when you rest.</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {CHARACTERS.map(({ key, name, what, Component }) => (
            <CharacterCard key={key} id={key} name={name} what={what} Component={Component} />
          ))}
        </div>
      </section>
    </div>
  );
}
