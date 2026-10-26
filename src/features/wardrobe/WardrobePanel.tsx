import { Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Panel } from "@/features/shell/PageHeader";
import { petSay } from "@/ipc";
import { cn } from "@/lib/utils";
import { ITEMS, OUTFITS, SLOTS, SLOT_LABEL, toggleItem, toggleOutfit, type Wardrobe } from "./wardrobe";
import { useWardrobe } from "./useWardrobe";

const chip = (on: boolean) =>
  cn("h-8 rounded-md border px-3 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    on ? "border-primary bg-primary/10 font-medium text-foreground" : "bg-card text-muted-foreground hover:text-foreground");

/** Accessories and outfits for the bear. All free, none locked. */
export function WardrobePanel() {
  const { wardrobe, save } = useWardrobe();
  if (!wardrobe) return null;
  const apply = (next: Wardrobe) => {
    void save(next);
    // The pet window is a separate window: this makes it look at the new look straight away.
    void petSay({ text: next.worn.length ? "New look!" : "Back to plain me", pose: "cheer", ms: 3500 });
  };
  return (
    <section aria-label="Accessories and outfits" className="mt-6">
      <h2 className="text-[15px] font-semibold">Accessories and outfits</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Dress the bear. Everything is free and open. Picture characters from the library keep their own look.</p>
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
