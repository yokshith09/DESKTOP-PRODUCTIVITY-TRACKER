import { useEffect, useState } from "react";
import { Presets } from "@/components/Presets";
import { dayPresets } from "@/lib/datePresets";
import { CalendarClock, CalendarPlus, Timer, ExternalLink, FilePlus2, Flag, FolderKanban, History, Link2, MessageSquarePlus, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { NoteEditor } from "@/features/notes/NoteEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNotes, useTask, useTaskActions, useTaskHistory, useWorkUpdates } from "@/hooks/useLoaf";
import { ymd } from "@/lib/dates";
import { STATUS_LABEL, isFinished, transitionsFrom } from "@/lib/taskStatus";
import { clockTime, formatWhen } from "@/lib/time";
import { cn } from "@/lib/utils";
import { errorMessage, ipc, type Priority, type Task, type TaskEvent } from "@/ipc";
import { notify } from "@/lib/notify";
import { clock as focusClock } from "@/lib/focus";
import { toEdit } from "./edit";
import { useFocus } from "@/hooks/useFocus";
import { StarButton } from "./TaskBits";
import { LinksEditor, PlanEditor, RepeatHistory, planOf, planStateOf, samePlan } from "./TaskPlanEditor";

const NONE = "none";
const PRIORITIES = [{ value: NONE, label: "None" }, { value: "LOW", label: "Low" }, { value: "MEDIUM", label: "Medium" }, { value: "HIGH", label: "High" }];
const DELETE_WINDOW_MS = 5 * 60_000;

function Field({ icon, label, htmlFor, children, className }: { icon: React.ReactNode; label: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground [&_svg]:size-3.5">{icon}{label}</label>
      {children}
    </div>
  );
}

const day = (s: string | null) => (s ? new Date(`${s}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" }) : "");

function describe(e: TaskEvent): string {
  switch (e.kind) {
    case "CREATED": return "Created";
    case "STATUS": return `${STATUS_LABEL[(e.from_status ?? "PLANNED") as Task["status"]] ?? e.from_status} → ${STATUS_LABEL[(e.to_status ?? "PLANNED") as Task["status"]] ?? e.to_status}`;
    case "DEFERRED": return `Moved from ${day(e.from_date) || "no day"} to ${day(e.to_date)}`;
    case "EDITED": return e.to_date !== null ? `Planned day set to ${day(e.to_date)}` : "Edited";
    default: return e.kind.charAt(0) + e.kind.slice(1).toLowerCase();
  }
}

/** Everything about one task: edit it, move it through its life, defer it, log progress, see its history. */
export function TaskDetail({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { data: task } = useTask(taskId);
  return (
    <Dialog open={taskId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden">
        {task ? <Body key={task.id} task={task} onClose={onClose} /> : <div className="p-8 text-center text-[13px] text-muted-foreground"><DialogTitle className="sr-only">Task</DialogTitle>Loading…</div>}
      </DialogContent>
    </Dialog>
  );
}

function Body({ task, onClose }: { task: Task; onClose: () => void }) {
  const actions = useTaskActions();
  const focus = useFocus();
  const { data: notes = [] } = useNotes(false, null, "last_edited");
  const { data: history = [] } = useTaskHistory(task.id);
  const { data: updates = [] } = useWorkUpdates(task.id);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [project, setProject] = useState(task.project ?? "");
  const [priority, setPriority] = useState<string>(task.priority ?? NONE);
  const [planned, setPlanned] = useState(task.planned_date ?? "");
  const [due, setDue] = useState(task.due_date ?? "");
  const [noteId, setNoteId] = useState(task.note_id ?? "");
  const [plan, setPlan] = useState(() => planStateOf(task));
  const planChanged = !samePlan(planOf(plan), planOf(planStateOf(task)));
  const [update, setUpdate] = useState("");
  const [deferTo, setDeferTo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const qc = useQueryClient();
  /** FR-42: make a note from this task (title and details), link it, and open it. */
  const noteFromTask = async () => {
    try {
      const note = await ipc.noteCreate({ title: title.trim() || task.title, body: description });
      await actions.update(task.id, { ...toEdit(task), note_id: note.id });
      setNoteId(note.id);
      await qc.invalidateQueries({ queryKey: ["notes"] });
      setOpenNote(note.id);
    } catch (e) {
      notify.error(errorMessage(e));
    }
  };
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);

  const finished = isFinished(task.status);
  const dirty = title.trim() !== task.title || description !== task.description || project.trim() !== (task.project ?? "")
    || priority !== (task.priority ?? NONE) || planned !== (task.planned_date ?? "") || due !== (task.due_date ?? "") || noteId !== (task.note_id ?? "") || planChanged;
  const tomorrow = ymd(new Date(new Date().setDate(new Date().getDate() + 1)));

  const save = async () => {
    if (!title.trim()) return notify.warning("Give the task a title.");
    // Nothing changed: Save still closes, like the owner expects (never a dead button).
    if (!dirty) return onClose();
    if (plan.mode === "repeat" && plan.repeat.kind === "weekly" && plan.repeat.days.length === 0) return notify.warning("Pick at least one day of the week.");
    if (plan.mode === "days" && plan.days.length === 0) return notify.warning("Pick at least one day.");
    await actions.update(task.id, {
      ...toEdit(task), title: title.trim(), description, project: project.trim() || null,
      priority: priority === NONE ? null : (priority as Priority), planned_date: planned || null, due_date: due || null, note_id: noteId || null,
    });
    if (planChanged) await actions.setPlan(task.id, planOf(plan));
    notify.success("Task saved");
    // FR-41: after an edit, back to the screen the task was opened from (Today or Tasks).
    onClose();
  };
  const addUpdate = async () => {
    if (!update.trim()) return;
    await actions.addUpdate(task.id, update);
    setUpdate("");
  };

  return (
    <>
      <div className="flex items-start gap-3 border-b p-5 pr-12">
        <div className="min-w-0 flex-1">
          <DialogTitle className="sr-only">Task: {task.title}</DialogTitle>
          <DialogDescription className="mb-1.5 flex items-center gap-2 text-xs">
            <Badge variant={task.status === "COMPLETED" ? "success" : task.status === "IN_PROGRESS" ? "primary" : "default"}>{STATUS_LABEL[task.status]}</Badge>
            {task.due_date && task.due_date < ymd(new Date()) && !finished && <Badge variant="destructive">Overdue</Badge>}
          </DialogDescription>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} aria-label="Title"
            className="w-full bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
          />
        </div>
        <StarButton starred={task.starred} title={task.title} onToggle={() => void actions.star(task.id, !task.starred)} className="mt-6 opacity-100" />
      </div>

      <div className="max-h-[68vh] space-y-5 overflow-y-auto p-5">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Status">
          {transitionsFrom(task.status).map((t) => (
            <Button key={t.to} size="sm" variant={t.to === "COMPLETED" ? "default" : "outline"} onClick={() => void actions.transition(task.id, t.to)}>{t.label}</Button>
          ))}
          {!finished && !focus.session && (
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => void focus.start("FOCUS", 25, task.id)}><Timer />Focus 25 min</Button>
          )}
          {focus.session?.task_id === task.id && <span className="ml-auto text-xs font-medium text-primary tabular-nums">Focusing · {focusClock(focus.remaining)} left</span>}
        </div>

        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={20000} aria-label="Description" placeholder="Add details…"
          className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />

        <LinksEditor task={task} />

        <Field icon={<CalendarPlus />} label="When">
          <PlanEditor value={plan} onChange={setPlan} planned={planned} onPlanned={setPlanned} />
        </Field>
        <RepeatHistory task={task} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field icon={<Flag />} label="Priority" className="sm:col-span-2">
            <ToggleGroup type="single" value={priority} onValueChange={(v) => v && setPriority(v)} aria-label="Priority" className="w-full">
              {PRIORITIES.map((p) => <ToggleGroupItem key={p.value} value={p.value} className="flex-1 px-2">{p.label}</ToggleGroupItem>)}
            </ToggleGroup>
          </Field>
          <Field icon={<CalendarClock />} label="Deadline" htmlFor="td-due"><Input id="td-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} /><Presets label="Deadline presets" options={dayPresets()} value={due} onPick={setDue} /></Field>
          <Field icon={<FolderKanban />} label="Project" htmlFor="td-project"><Input id="td-project" value={project} maxLength={100} onChange={(e) => setProject(e.target.value)} placeholder="None" /></Field>
          <Field icon={<Link2 />} label="Linked note" htmlFor="td-note">
            <select id="td-note" value={noteId} onChange={(e) => setNoteId(e.target.value)} className="h-8 w-full rounded-md border border-input bg-card px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">None</option>
              {notes.map((n) => <option key={n.id} value={n.id}>{n.title || "Untitled"}</option>)}
            </select>
            {noteId ? (
              <Button size="sm" variant="outline" className="mt-1.5 w-full" onClick={() => setOpenNote(noteId)}><ExternalLink />Open note</Button>
            ) : (
              <Button size="sm" variant="outline" className="mt-1.5 w-full" onClick={() => void noteFromTask()}><FilePlus2 />New note from this task</Button>
            )}
          </Field>
        </div>

        {!finished && plan.mode === "one" && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
            <span className="mr-1 text-xs font-medium text-muted-foreground">Defer</span>
            <Button size="sm" variant="outline" aria-label="Defer to tomorrow" onClick={() => void actions.defer(task.id, tomorrow)}>Tomorrow</Button>
            <Input type="date" value={deferTo} min={tomorrow} onChange={(e) => setDeferTo(e.target.value)} aria-label="Defer to" className="w-40" />
            <Button size="sm" variant="outline" disabled={!deferTo} onClick={() => void actions.defer(task.id, deferTo).then(() => setDeferTo(""))}>Move</Button>
          </div>
        )}

        <section aria-label="Work updates">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><MessageSquarePlus className="size-3.5" />Work updates<span className="tabular-nums text-muted-foreground/70">{updates.length}</span></h3>
          <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void addUpdate(); }}>
            <Input value={update} onChange={(e) => setUpdate(e.target.value)} placeholder="What happened? (kept with a time stamp)" aria-label="New work update" maxLength={5000} />
            <Button type="submit" size="sm" variant="secondary" disabled={!update.trim()}>Add</Button>
          </form>
          {updates.length === 0 ? <p className="text-xs text-muted-foreground">No updates yet.</p> : (
            <ul className="space-y-2">
              {updates.map((u) => (
                <li key={u.id} className="group flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-line text-[13px] leading-snug">{u.body}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{formatWhen(u.created_at, now)}</p>
                  </div>
                  {now - u.created_at <= DELETE_WINDOW_MS && (
                    <button type="button" aria-label="Delete update" title="Can be deleted for 5 minutes" onClick={() => void actions.removeUpdate(u.id)}
                      className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground outline-none hover:bg-destructive/15 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"><X className="size-3.5" /></button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="History">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><History className="size-3.5" />History</h3>
          <ol className="space-y-1">
            {[...history].reverse().map((e, i) => (
              <li key={i} className="flex items-baseline gap-3 text-[12px]">
                <span className="w-32 shrink-0 tabular-nums text-muted-foreground">{formatWhen(e.at, now)}</span>
                <span>{describe(e)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-muted-foreground">Created {formatWhen(task.created_at, now)}{task.completed_at ? ` · finished at ${clockTime(task.completed_at)}` : ""}</p>
        </section>
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        {confirmDelete ? (
          <>
            <span className="text-xs text-destructive">{finished ? "Delete this task and its history for good?" : "This task isn’t finished. Delete it anyway?"}</span>
            <Button size="sm" variant="destructive" onClick={() => void actions.removeAny(task).then(onClose)}>Delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Keep</Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 />Delete task</Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={() => void save()}>Save changes</Button>
        </div>
      </div>
      <NoteEditor noteId={openNote} onClose={() => setOpenNote(null)} />
    </>
  );
}
