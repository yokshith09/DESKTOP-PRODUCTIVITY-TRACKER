import { useQueries } from "@tanstack/react-query";
import { Bars, type Bar } from "@/features/charts/Bars";
import { Tile } from "@/features/shell/PageHeader";
import { ipc } from "@/ipc";
import { useRecentLogs, useUsage } from "@/hooks/useLoaf";
import { dayLabel, weekdayNarrow, ymd } from "@/lib/dates";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { categoryStyle } from "./categories";

const DAY = 86_400_000;

function Figure({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string | undefined }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-[26px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-1.5 truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Time, analysed: per-app shares, screen time per day and by hour, and task completion. All from local data. */
export function TimeAnalytics({ from, to, days, tracking }: { from: number; to: number; days: number; tracking: boolean }) {
  const { data: usage } = useUsage(from, to);
  const logs = useRecentLogs(30);
  const dayStarts = Array.from({ length: days }, (_, i) => new Date(new Date(from).getFullYear(), new Date(from).getMonth(), new Date(from).getDate() + i).getTime());
  const daily = useQueries({
    queries: dayStarts.map((s) => ({
      queryKey: ["usage", s, s + DAY],
      queryFn: () => ipc.usageSummary(s, new Date(new Date(s).getFullYear(), new Date(s).getMonth(), new Date(s).getDate() + 1).getTime()),
      enabled: days > 1,
    })),
  });

  const apps = usage?.apps ?? [];
  const total = usage?.total_seconds ?? 0;
  const top = apps.slice(0, 8);
  const topMax = Math.max(1, ...top.map((a) => a.total_seconds));
  const byCategory = new Map<string, number>();
  for (const a of apps) byCategory.set(a.category, (byCategory.get(a.category) ?? 0) + a.total_seconds);
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  const perDay = dayStarts.map((s, i) => ({ date: new Date(s), seconds: days > 1 ? (daily[i]?.data?.total_seconds ?? 0) : total }));
  const busiest = perDay.reduce<(typeof perDay)[number] | null>((m, d) => (d.seconds > (m?.seconds ?? 0) ? d : m), null);
  const dayBars: Bar[] = perDay.map(({ date, seconds }) => ({
    key: ymd(date), value: seconds, label: days > 7 ? String(date.getDate()) : weekdayNarrow(date), active: true,
    title: `${dayLabel(date)}: ${formatDuration(seconds)}`,
  }));
  const hourly = usage?.hourly_seconds ?? new Array<number>(24).fill(0);
  const hourBars: Bar[] = hourly.map((v, h) => ({ key: String(h), value: v, label: h % 6 === 0 ? String(h) : "", title: `${String(h).padStart(2, "0")}:00: ${formatDuration(v)}`, active: v === Math.max(...hourly) && v > 0 }));

  const inRange = logs.filter(({ date }) => date.getTime() >= from && date.getTime() < to);
  const done = inRange.reduce((n, d) => n + (d.log?.snapshot.stats.completed_count ?? 0), 0);
  const planned = inRange.reduce((n, d) => n + (d.log?.snapshot.stats.planned_count ?? 0), 0);
  const rate = planned > 0 ? Math.min(100, Math.round((done / planned) * 100)) : null;
  const taskBars: Bar[] = dayStarts.map((s) => {
    const entry = logs.find(({ date }) => date.getTime() === s);
    const n = entry?.log?.snapshot.stats.completed_count ?? 0;
    const date = new Date(s);
    return { key: ymd(date), value: n, label: days > 7 ? String(date.getDate()) : weekdayNarrow(date), active: true, title: `${dayLabel(date)}: ${n} completed` };
  });
  const empty = <p className="py-10 text-center text-[13px] text-muted-foreground">{tracking ? "Nothing recorded yet." : "Turn on app tracking to see this."}</p>;

  return (
    <div className="space-y-4" data-testid="time-analytics">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Figure label="Screen time" value={tracking ? formatDuration(total) : "—"} sub={tracking ? (days > 1 ? `~${formatDuration(total / days)} a day` : "in the day") : "Tracking is off"} />
        <Figure label="Busiest day" value={tracking && busiest && busiest.seconds > 0 ? dayLabel(busiest.date) : "—"} sub={busiest && busiest.seconds > 0 ? formatDuration(busiest.seconds) : undefined} />
        <Figure label="Tasks done" value={done} sub={planned ? `of ${planned} planned` : "in this period"} />
        <Figure label="Completion" value={rate === null ? "—" : `${rate}%`} sub={rate === null ? "Nothing planned" : "of planned tasks"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tile className="h-72" title="Screen time per day" bodyClassName="flex p-4">
          {tracking && total > 0 ? <Bars bars={dayBars} className="flex-1" ariaLabel={`Screen time per day: ${perDay.map((d) => formatDuration(d.seconds)).join(", ")}`} /> : empty}
        </Tile>
        <Tile className="h-72" title="Busiest hours" bodyClassName="flex p-4">
          {tracking && total > 0 ? <Bars bars={hourBars} className="flex-1" ariaLabel="Screen time by hour of the day" /> : empty}
        </Tile>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tile title="Top apps" bodyClassName="p-4">
          {top.length === 0 ? empty : (
            <ul className="space-y-3">
              {top.map((a) => (
                <li key={a.app}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="min-w-0 flex-1 truncate">{a.app}</span>
                    <span className="tabular-nums text-muted-foreground">{total > 0 ? Math.round((a.total_seconds / total) * 100) : 0}%</span>
                    <span className="w-14 text-right font-medium tabular-nums">{formatDuration(a.total_seconds)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", categoryStyle(a.category).bar)} style={{ width: `${(a.total_seconds / topMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tile>
        <Tile title="By category" bodyClassName="p-4">
          {categories.length === 0 ? empty : (
            <ul className="space-y-2.5">
              {categories.map(([c, v]) => (
                <li key={c} className="flex items-center gap-2.5 text-[13px]">
                  <span className={cn("size-2 rounded-full", categoryStyle(c).dot)} />
                  <span className="flex-1">{c}</span>
                  <span className="tabular-nums text-muted-foreground">{total > 0 ? Math.round((v / total) * 100) : 0}%</span>
                  <span className="w-14 text-right font-medium tabular-nums">{formatDuration(v)}</span>
                </li>
              ))}
            </ul>
          )}
        </Tile>
      </div>

      <Tile className="h-64" title="Tasks completed" action={<span className="text-[11px] text-muted-foreground">{done} in this period</span>} bodyClassName="flex p-4">
        <Bars bars={taskBars} className="flex-1" ariaLabel={`Tasks completed per day: ${taskBars.map((b) => b.value).join(", ")}`} />
      </Tile>
    </div>
  );
}
