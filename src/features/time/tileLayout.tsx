import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ipc } from "@/ipc";

/**
 * Time tiles sized by the user (FR-44): how wide the Apps/Sites list is beside "By category",
 * and how tall the row is. Snapped choices, remembered in prefs `ui.timeLayout`.
 */
export type TileLayout = { width: "wide" | "even" | "stacked"; height: "short" | "medium" | "tall" };
export const DEFAULT_LAYOUT: TileLayout = { width: "wide", height: "medium" };

export const WIDTH_CLASS: Record<TileLayout["width"], [string, string]> = {
  wide: ["lg:col-span-8", "lg:col-span-4"],
  even: ["lg:col-span-6", "lg:col-span-6"],
  stacked: ["lg:col-span-12", "lg:col-span-12"],
};
export const HEIGHT_CLASS: Record<TileLayout["height"], string> = {
  short: "lg:[&>*]:h-[20rem]",
  medium: "lg:[&>*]:h-[30rem]",
  tall: "lg:[&>*]:h-[40rem]",
};

export function parseLayout(raw: unknown): TileLayout {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<TileLayout>;
  return {
    width: r.width && r.width in WIDTH_CLASS ? r.width : DEFAULT_LAYOUT.width,
    height: r.height && r.height in HEIGHT_CLASS ? r.height : DEFAULT_LAYOUT.height,
  };
}

export function useTileLayout(): [TileLayout, (l: TileLayout) => void] {
  const qc = useQueryClient();
  const key = ["prefs", "ui.timeLayout"];
  const { data } = useQuery({ queryKey: key, queryFn: async () => parseLayout(await ipc.prefsGet("ui.timeLayout")) });
  return [data ?? DEFAULT_LAYOUT, (l) => { qc.setQueryData(key, l); void ipc.prefsSet("ui.timeLayout", l); }];
}

export function TileLayoutPicker({ value, onChange }: { value: TileLayout; onChange: (l: TileLayout) => void }) {
  return (
    <div className="hidden items-center justify-end gap-3 text-xs text-muted-foreground lg:flex" role="group" aria-label="Tile layout">
      <span>Layout</span>
      <ToggleGroup type="single" value={value.width} onValueChange={(v) => v && onChange({ ...value, width: v as TileLayout["width"] })} aria-label="Tile width">
        <ToggleGroupItem value="wide">Wide list</ToggleGroupItem>
        <ToggleGroupItem value="even">Even</ToggleGroupItem>
        <ToggleGroupItem value="stacked">Stacked</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" value={value.height} onValueChange={(v) => v && onChange({ ...value, height: v as TileLayout["height"] })} aria-label="Tile height">
        <ToggleGroupItem value="short">Short</ToggleGroupItem>
        <ToggleGroupItem value="medium">Medium</ToggleGroupItem>
        <ToggleGroupItem value="tall">Tall</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
