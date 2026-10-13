import { Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useLoaf";
import { useSetting } from "@/hooks/useTheme";

/**
 * What to say when no website time is recorded yet. Site time is read from the browser's address
 * bar (no extension), behind its own switch, so the useful answer is either "turn it on" or
 * "browse a little".
 */
export function SitesEmpty({ compact = false }: { compact?: boolean }) {
  const { data: settings } = useSettings();
  const [, setSites] = useSetting("tracking.sites");
  const on = settings?.["tracking.sites"] === true;
  if (on) {
    return (
      <p className="text-xs leading-relaxed text-muted-foreground">
        No sites yet. Browse in Chrome, Edge, Brave or Firefox and the site names show up here. Private windows are never counted.
      </p>
    );
  }
  return (
    <div className={compact ? "space-y-2.5" : "mx-auto flex max-w-sm flex-col items-center py-6 text-center"}>
      <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Globe className="size-4" /></span>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Website time is off. When it is on, Loaf reads only the site name (like github.com) from your browser, never the full address.
      </p>
      <label className="flex items-center gap-2 text-xs font-medium">
        <Switch checked={false} onCheckedChange={(v) => void setSites(v)} aria-label="Turn on website tracking" />
        Track websites
      </label>
    </div>
  );
}
