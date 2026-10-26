import { Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Panel } from "@/features/shell/PageHeader";
import { petSay } from "@/ipc";
import { cn } from "@/lib/utils";
import { FIT_LIMITS, NO_FIT, type Fit } from "./spriteAnchors";
import { ITEMS, OUTFITS, SLOTS, SLOT_LABEL, toggleItem, toggleOutfit, type Wardrobe } from "./wardrobe";
import { useWardrobe } from "./useWardrobe";

const FITS = [
  { key: "x", label: "Left / right", step: 1 },
  { key: "y", label: "Up / down", step: 1 },
  { key: "s", label: "Size", step: 0.05 },
] as const;

const chip = (on: boolean) =>
  cn("h-8 rounded-md border px-3 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    on ? "border-primary bg-primary/10 font-medium text-foreground" : "bg-card text-muted-foreground hover:text-foreground");

/** Accessories and outfits for the bear. All free, none locked. */
export function WardrobePanel({ character }: { character?: { id: string; name: string } | undefined }) {
  const { wardrobe, save, preview } = useWardrobe();
  if (!wardrobe) return null;
  const apply = (next: Wardrobe) => {
    void save(next);
    // The pet window is a separate window: this makes it look at the new look straight away.
    void petSay({ text: next.worn.length ? "New look!" : "Back to plain me", pose: "cheer", ms: 3500 });
  };
  return (
    <section aria-label="Accessories and outfits" className="mt-6">
      <h2 className="text-[15px] font-semibold">Accessories and outfits</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Dress your pet, whichever character it is. Everything is free and open.</p>
      <Panel className="mt-3 space-y-4 p-4">
        <div role="group" aria-label="Outfits">
          <p className="text-xs font-medium text-muted-foreground">Outfits</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {OUTFITS.map((o) => (
              <button key={o.id} type="button" aria-pressed={wardrobe.outfit === o.id} className={chip(wardrobe.outfit === o.id)} onClick={() => apply(toggleOutfit(wardrobe, o.id))}>{o.name}</button>
            ))}
          </div>
        </div>
        {SLOTS.map((slot) => (
          <div key={slot} role="group" aria-label={SLOT_LABEL[slot]}>
            <p className="text-xs font-medium text-muted-foreground">{SLOT_LABEL[slot]}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ITEMS.filter((i) => i.slot === slot).map((i) => {
                const on = wardrobe.worn.includes(i.id);
                return <button key={i.id} type="button" aria-pressed={on} className={chip(on)} onClick={() => apply(toggleItem(wardrobe, i.id))}>{i.name}</button>;
              })}
            </div>
          </div>
        ))}
        {character && (
          <div role="group" aria-label={`Fit for ${character.name}`} className="border-t pt-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium">Fit for {character.name}</p>
                <p className="text-xs text-muted-foreground">Placed automatically from the picture. Nudge it if something sits wrong.</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { apply({ ...wardrobe, fits: Object.fromEntries(Object.entries(wardrobe.fits).filter(([id]) => id !== character.id)) }); }}>Reset</Button>
            </div>
            <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-3">
              {FITS.map(({ key, label, step }) => {
                const fit: Fit = wardrobe.fits[character.id] ?? NO_FIT;
                const [min, max] = FIT_LIMITS[key];
                const next = (v: number) => ({ ...wardrobe, fits: { ...wardrobe.fits, [character.id]: { ...fit, [key]: v } } });
                return (
                  <label key={key} className="block text-xs text-muted-foreground">
                    {label}
                    <Slider className="mt-2" min={min} max={max} step={step} value={[fit[key]]} aria-label={label}
                      onValueChange={([v]) => v !== undefined && preview(next(v))}
                      onValueCommit={([v]) => { if (v === undefined) return; void save(next(v)); void petSay({ text: "How's that?", pose: "idle", ms: 2500 }); }} />
                  </label>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <div>
            <p className="text-[13px] font-medium">Party hat on birthdays</p>
            <p className="text-xs text-muted-foreground">Yours and the pet's. It goes back to your look the next day.</p>
          </div>
          <Switch checked={wardrobe.partyOnBirthday} onCheckedChange={(v) => void save({ ...wardrobe, partyOnBirthday: v })} aria-label="Party hat on birthdays" />
        </div>
        <Button size="sm" variant="outline" disabled={wardrobe.worn.length === 0} onClick={() => apply({ ...wardrobe, worn: [], outfit: "" })}><Shirt />Take everything off</Button>
      </Panel>
    </section>
  );
}
