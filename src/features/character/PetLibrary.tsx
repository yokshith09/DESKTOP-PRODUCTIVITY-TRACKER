import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/features/shell/PageHeader";
import { useSetting } from "@/hooks/useTheme";
import { errorMessage, ipc, type PetPack } from "@/ipc";
import { SpritePet } from "./SpritePet";

const LIBRARY = ["pets", "library"] as const;

/** One pack: its idle animation, name, where it came from, and the actions. */
function PackCard({ pack, active, onUse, onRemove }: { pack: PetPack; active: boolean; onUse: () => void; onRemove: () => void }) {
  const { data: sheet } = useQuery({ queryKey: ["pets", "sheet", pack.id], queryFn: () => ipc.petsSheet(pack.id), staleTime: Infinity });
  return (
    <Panel className="flex items-center gap-3 p-3">
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-muted/40">
        {sheet && <SpritePet sheet={sheet} size={64} label={`${pack.display_name} (idle)`} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{pack.display_name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {pack.source === "codex" ? "From Codex / Petdex" : "Imported"} · {pack.rows === 11 ? "V2" : "V1"}
        </p>
      </div>
      <Button size="sm" variant={active ? "default" : "outline"} aria-pressed={active} onClick={onUse}>
        {active ? "In use" : "Use"}
      </Button>
      {pack.source === "loaf" && (
        <Button size="icon" variant="ghost" aria-label={`Remove ${pack.display_name}`} onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      )}
    </Panel>
  );
}

/**
 * Pet library (FR-63): every Codex / OpenPets pack Loaf can see, the button to import one from a
 * folder, and which one the desktop pet shows. Packs are art only; nothing in them runs.
 */
export function PetLibrary() {
  const qc = useQueryClient();
  const { data: packs = [] } = useQuery({ queryKey: LIBRARY, queryFn: ipc.petsList });
  const [current, setCurrent] = useSetting("pet.pack");
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: LIBRARY });

  const importPack = async () => {
    setBusy(true);
    try {
      const pack = await ipc.petsImport();
      if (pack) {
        toast.success(`${pack.display_name} added`);
        await refresh();
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (pack: PetPack) => {
    await ipc.petsRemove(pack.id);
    if (current === pack.id) await setCurrent(null);
    await refresh();
  };

  return (
    <section aria-label="Pet library" className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Pet library</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Any Codex or OpenPets pet works here: pets installed by Codex or Petdex (<code>.codex/pets</code>, <code>.petdex/pets</code>) show up by themselves, or import a pet folder.
          </p>
        </div>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => void importPack()}>
          <FolderOpen className="size-4" /> Import pet folder
        </Button>
      </div>
      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        <Panel className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Loaf the bear</p>
            <p className="text-xs text-muted-foreground">Built in</p>
          </div>
          <Button size="sm" variant={current ? "outline" : "default"} aria-pressed={!current} onClick={() => void setCurrent(null)}>
            {current ? "Use" : "In use"}
          </Button>
        </Panel>
        {packs.map((p) => (
          <PackCard key={`${p.source}-${p.id}`} pack={p} active={current === p.id} onUse={() => void setCurrent(p.id)} onRemove={() => void remove(p)} />
        ))}
      </div>
      {packs.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">No pets yet. Install one with Petdex (for example <code>npx petdex install boba</code>) and it appears here, or unzip a downloaded pet and import the folder.</p>
      )}
    </section>
  );
}
