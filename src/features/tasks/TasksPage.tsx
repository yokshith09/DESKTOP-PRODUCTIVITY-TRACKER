import { useMemo, useState } from "react";
import { CalendarClock, ChevronDown, ListChecks, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PRIORITY } from "@/features/overview/TodayAgenda";
import { Empty } from "@/features/notes/NotesBoard";
import { PageHeader } from "@/features/shell/PageHeader";
import { useAllTasks, useTaskActions, useTasksQuery } from "@/hooks/useLoaf";
import { STATUSES, STATUS_LABEL } from "@/lib/taskStatus";
import { cn } from "@/lib/utils";
import type { Priority, TaskFilters, TaskRow, TaskStatus, TaskView } from "@/ipc";
import { TaskDetail } from "./TaskDetail";

const VIEWS: { key: TaskView; label: string; empty: string }[] = [
  { key: "today", label: "Today", empty: "Nothing planned for today." },
  { key: "upcoming", label: "Upcoming", empty: "Nothing planned for the next 7 days." },
  { key: "pending", label: "Pending", empty: "Nothing is paused. Pause a task when you are waiting on something." },
  { key: "all", label: "All", empty: "No tasks match." },
  { key: "completed", label: "Completed", empty: "Nothing completed in this range yet." },
];

const shortDate = (ymd: string) => new Date(`${ymd}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" });
const when = (ms: number) => new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });

function Row({ row, onOpen }: { row: TaskRow; onOpen: (id: string) => void }) {
  const { task, overdue } = row;
  const actions = useTaskActions();
  const done = task.status === "COMPLETED";
  const toggle = async () => {
    if (done) return void actions.setDone(task.id, false);
    await actions.setDone(task.id, true);
    toast(`Completed “${task.title}”`, { action: { label: "Undo", onClick: () => void actions.setDone(task.id, false) } });
  };
  return (
    <li className="group flex h-11 items-center gap-3 rounded-md px-2 hover:bg-accent/50">
      <Checkbox aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`} checked={done} disabled={task.status === "CANCELLED"} onCheckedChange={() => void toggle()} />
      <button type="button" onClick={() => onOpen(task.id)} aria-label={`Open ${task.title}`}
        className={cn("min-w-0 flex-1 truncate rounded text-left text-[13px] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring", (done || task.status === "CANCELLED") && "text-muted-foreground line-through")}>
        {task.title}
      </button>
      {task.project && <Badge>{task.project}</Badge>}
      {task.status !== "PLANNED" && task.status !== "COMPLETED" && <Badge variant={task.status === "IN_PROGRESS" ? "primary" : "default"}>{STATUS_LABEL[task.status]}</Badge>}
      {overdue && <Badge variant="destructive">Overdue</Badge>}
      {task.due_date && !overdue && (
        <span className="flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground" title="Deadline"><CalendarClock className="size-3" />{shortDate(task.due_date)}</span>
      )}
      {done && task.completed_at && <span className="w-14 text-right text-[11px] tabular-nums text-muted-foreground">{when(task.completed_at)}</span>}
      {task.priority && (
        <span className={cn("w-16 text-right text-[11px]", PRIORITY[task.priority].cls)} title={`${PRIORITY[task.priority].label} priority`}>
          <span aria-hidden>{PRIORITY[task.priority].glyph}</span> {PRIORITY[task.priority].label}
        </span>
      )}
    </li>
  );
}

function Pick({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8" aria-label={`${label}: ${current?.label ?? ""}`}>
          {value === "" ? label : current?.label}<ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          <DropdownMenuRadioItem value="">Any {label.toLowerCase()}</DropdownMenuRadioItem>
          {options.map((o) => <DropdownMenuRadioItem key={o.value} value={o.value}>{o.label}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Tasks: the five views, filters, search and quick add (R1-27). Click a task for its detail. */
export function TasksPage() {
  const [view, setView] = useState<TaskView>("today");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { quickAdd } = useTaskActions();

  const filters = useMemo<TaskFilters>(() => ({
    ...(priority ? { priority: priority as Priority } : {}),
    ...(project ? { project } : {}),
    ...(status && view === "all" ? { status: status as TaskStatus } : {}),
    ...(from && (view === "all" || view === "completed") ? { from } : {}),
    ...(to && (view === "all" || view === "completed") ? { to } : {}),
  }), [priority, project, status, from, to, view]);

  const { data: rows = [], isLoading } = useTasksQuery(view, filters);
  const { data: everything = [] } = useAllTasks();
  const projects = useMemo(() => [...new Set(everything.map((r) => r.task.project).filter((p): p is string => !!p))].sort(), [everything]);

  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter(({ task }) => `${task.title} ${task.description} ${task.project ?? ""}`.toLowerCase().includes(q)) : rows;
  const filtered = !!(priority || project || status || from || to);
  const meta = VIEWS.find((v) => v.key === view);

  const add = async () => {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    await quickAdd(title);
  };
  const reset = () => { setPriority(""); setStatus(""); setProject(""); setFrom(""); setTo(""); };

  return (
    <div className="space-y-4">
      <PageHeader title="Tasks" description="Plan, run and finish your work." />

      <form className="flex max-w-2xl gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a task for today" aria-label="New task" maxLength={300} />
        <Button type="submit" variant="secondary" size="icon" aria-label="Add task" disabled={!draft.trim()}><Plus /></Button>
      </form>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as TaskView)} aria-label="View">
          {VIEWS.map((v) => <ToggleGroupItem key={v.key} value={v.key}>{v.label}</ToggleGroupItem>)}
        </ToggleGroup>
        <Pick label="Priority" value={priority} onChange={setPriority} options={(["HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => ({ value: p, label: PRIORITY[p].label }))} />
        {projects.length > 0 && <Pick label="Project" value={project} onChange={setProject} options={projects.map((p) => ({ value: p, label: p }))} />}
        {view === "all" && <Pick label="Status" value={status} onChange={setStatus} options={STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />}
        {(view === "all" || view === "completed") && (
          <>
            <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} aria-label="From date" className="w-36" />
            <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label="To date" className="w-36" />
          </>
        )}
        {filtered && <Button variant="ghost" size="sm" onClick={reset}>Reset filters</Button>}
        <label className="relative ml-auto flex h-8 w-56 items-center">
          <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setQuery("")}
            placeholder="Search tasks" aria-label="Search tasks"
            className="h-8 w-full rounded-md border border-input bg-card pl-8 pr-7 text-[13px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-1.5 grid size-5 place-items-center rounded text-muted-foreground hover:bg-accent"><X className="size-3.5" /></button>}
        </label>
      </div>

      <section aria-label="Task list" className="rounded-xl border bg-card p-2">
        {isLoading ? (
          <div className="space-y-2 p-2" aria-hidden>{[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />)}</div>
        ) : shown.length === 0 ? (
          <div className="p-4"><Empty icon={<ListChecks />} title={q || filtered ? "No tasks match" : (meta?.empty ?? "No tasks")} hint={q || filtered ? "Try a different word or reset the filters." : "Add one above to get started."} /></div>
        ) : (
          <ul>{shown.map((r) => <Row key={r.task.id} row={r} onOpen={setOpen} />)}</ul>
        )}
      </section>
      <p className="px-1 text-xs text-muted-foreground">{shown.length} {shown.length === 1 ? "task" : "tasks"}</p>

      <TaskDetail taskId={open} onClose={() => setOpen(null)} />
    </div>
  );
}
