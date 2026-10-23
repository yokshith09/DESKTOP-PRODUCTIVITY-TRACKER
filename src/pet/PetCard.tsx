import { Bell, CheckCircle2, Circle, Moon, NotebookPen, Star, Sun, Timer } from "lucide-react";
import { ipc } from "@/ipc";
import { PRIORITY } from "@/features/overview/TodayAgenda";
import { rangeBounds } from "@/features/time/range";
import { useDailyLog, useReminders, useTodayTasks, useTrackingStatus, useUsage } from "@/hooks/useLoaf";
import { ymd } from "@/lib/dates";
import { clockTime, formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Priority, TaskRow } from "@/ipc";
import { useFocus } from "@/hooks/useFocus";
import { clock } from "@/lib/focus";

const RANK: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

/** The two tasks that matter most right now: overdue first, then in progress, then by priority. */
export function topTasks(rows: TaskRow[], n = 2): TaskRow[] {
  const score = ({ task, overdue }: TaskRow) =>
    (overdue ? 0 : 10) + (task.status === "IN_PROGRESS" ? 0 : 5) + (task.priority ? RANK[task.priority] : 3);
  return [...rows].sort((a, b) => score(a) - score(b)).slice(0, n);
}

/** What the pet shows on hover: today's time, top apps, the two tasks that matter, and two lines of context. */
export function PetCard({ className, style, napping = false, onNap }: { className?: string; style?: React.CSSProperties; napping?: boolean; onNap?: (nap: boolean) => void }) {
  const today = rangeBounds("today");
  const { data: status } = useTrackingStatus();
  const { data: usage } = useUsage(today.from, today.to);
  const { data: tasks = [] } = useTodayTasks();
  const { data: reminders = [] } = useReminders(false);
  const { data: log } = useDailyLog(ymd(new Date()));
  const tracking = status?.enabled ?? false;
  const apps = (usage?.apps ?? []).slice(0, 3);
  const top = topTasks(tasks);
  const next = reminders.filter((r) => r.remind_at >= Date.now()).sort((a, b) => a.remind_at - b.remind_at)[0];
  const done = log?.snapshot.stats.completed_count ?? 0;
  const max = apps[0]?.total_seconds ?? 1;
  const focus = useFocus();

  return (
    <div className={cn("flex flex-col gap-3 overflow-hidden rounded-xl border bg-popover p-3.5 text-popover-foreground shadow-lg", className)} style={style} role="status" aria-label="Today at a glance">
      <div className="flex items-baseline justify-between">
        {focus.session ? (
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-primary" aria-label="Focus time left">
            {focus.session.kind === "BREAK" ? "Break" : "Focus"} · {clock(focus.remaining)} left{focus.session.label ? ` · ${focus.session.label}` : ""}
          </span>
        ) : (
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Today</span>
        )}
        <span className="text-[11px] text-muted-foreground">{new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
      </div>
      <div className="flex items-end gap-3">
        <p className="text-[28px] font-semibold leading-none tabular-nums">{tracking ? formatDuration(usage?.total_seconds ?? 0) : "—"}</p>
        <p className="pb-0.5 text-[11px] text-muted-foreground">{tracking ? `on screen · ${usage?.apps.length ?? 0} apps` : "Turn on app tracking in Settings"}</p>
      </div>
      {apps.length > 0 && (
        <ul className="space-y-1">
          {apps.map((a) => (
            <li key={a.app} className="flex items-center gap-2 text-[12px]">
              <span className="w-24 truncate">{a.app}</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (a.total_seconds / max) * 100)}%` }} />
              </span>
              <span className="w-12 text-right tabular-nums text-muted-foreground">{formatDuration(a.total_seconds)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t pt-2.5">
        {top.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">No tasks for today.</p>
        ) : (
          <ul className="space-y-1">
            {top.map(({ task, overdue }) => (
              // Tasks stand out on the card (owner 2026-10-23): a tinted row, starred ones marked.
              <li key={task.id} className={cn("flex items-center gap-2 rounded-md px-2 py-1 text-[12.5px] font-medium", overdue ? "bg-destructive/10" : "bg-primary/10")}>
                {task.starred ? <Star className="size-3 shrink-0 fill-current text-primary" /> : <Circle className="size-3 shrink-0 text-primary" />}
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                {overdue ? <span className="text-[11px] text-destructive">Overdue</span> : task.priority && (
                  <span className={cn("text-[11px]", PRIORITY[task.priority].cls)}>{PRIORITY[task.priority].label}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-0.5 text-[11px] text-muted-foreground">
        <p className="flex items-center gap-1.5 truncate"><Bell className="size-3" />{next ? `Next: ${next.title} · ${clockTime(next.remind_at)}` : "No reminders coming up"}</p>
        <p className="flex items-center gap-1.5"><CheckCircle2 className="size-3" />{done} done today · {tasks.length} still open</p>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-1.5 border-t pt-2.5" role="group" aria-label="Shortcuts">
        {focus.session ? (
          <CardButton icon={<Timer />} label="Stop focus" onClick={() => void focus.stop()} />
        ) : (
          <CardButton icon={<Timer />} label="Focus 25" onClick={() => void focus.start("FOCUS", 25)} />
        )}
        <CardButton icon={<NotebookPen />} label="Add note" onClick={() => void ipc.petCommand("new-note")} />
        {napping ? (
          <CardButton icon={<Sun />} label="Wake" onClick={() => onNap?.(false)} />
        ) : (
          <CardButton icon={<Moon />} label="Sleep" onClick={() => onNap?.(true)} />
        )}
      </div>
    </div>
  );
}

function CardButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} onPointerUp={(e) => e.stopPropagation()}
      className="flex h-8 items-center justify-center gap-1.5 rounded-md border bg-card text-[11.5px] font-medium outline-none hover:border-primary/50 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5">
      {icon}{label}
    </button>
  );
}
