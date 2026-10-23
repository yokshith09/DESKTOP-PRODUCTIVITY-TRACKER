import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Plug } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useRoutineReminder } from "@/features/routine/useRoutine";
import { useDailyGreeting } from "@/features/companion/useCompanion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBin, useBusSync, useLabels, useNoteActions, useNotes } from "@/hooks/useLoaf";
import { useAgenda } from "@/features/overview/TodayAgenda";
import { useTheme } from "@/hooks/useTheme";
import { ipc, onCommand, onEvent, type NoteSort } from "@/ipc";
import type { Reminder } from "@/ipc";
import { BinPage } from "@/features/bin/BinPage";
import { CharacterPage } from "@/features/character/CharacterPage";
import { NoteEditor } from "@/features/notes/NoteEditor";
import { NotesPage } from "@/features/notes/NotesPage";
import type { NotesLayout } from "@/features/notes/NotesBoard";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { ComingSoon } from "@/features/shell/ComingSoon";
import { Sidebar, type Page } from "@/features/shell/Sidebar";
import { TasksPage } from "@/features/tasks/TasksPage";
import { TimePage } from "@/features/time/TimePage";
import { TodayOverviewPage } from "@/features/overview/TodayOverviewPage";
import { MeetingsPage } from "@/features/meetings/MeetingsPage";
import type { TaskFocus } from "@/features/overview/YesterdayLine";
import { Welcome, useFirstRun, type WelcomeNext } from "@/features/welcome/Welcome";

const PAGES: readonly Page[] = ["today", "tasks", "time", "notes", "meetings", "archive", "bin", "character", "mcp", "settings"];

function Screen() {
  const [page, setPageState] = useState<Page>("today");
  const [labelId, setLabelId] = useState<string | null>(null);
  const [sort, setSort] = useState<NoteSort>("last_edited");
  const [layout, setLayoutState] = useState<NotesLayout>("grid");
  const [editing, setEditing] = useState<string | null>(null);
  const [newMeeting, setNewMeeting] = useState(0);
  const [taskFocus, setTaskFocus] = useState<TaskFocus | null>(null);

  useBusSync();
  const theme = useTheme();
  const firstRun = useFirstRun();
  // FR-85: "You have N daily routine tasks pending", once a day at the chosen time.
  useRoutineReminder();
  // FR-93/94: hello once a day, and birthdays.
  useDailyGreeting();
  const actions = useNoteActions();
  const { data: allNotes = [] } = useNotes(false, null, "last_edited");
  const { data: labels = [] } = useLabels();
  const agenda = useAgenda();
  const { data: bin = [] } = useBin();

  // Restore where the person left off (ui.last_view, ui.notes_layout).
  useEffect(() => {
    void ipc.prefsGet<Page>("ui.last_view").then((p) => p && PAGES.includes(p) && setPageState(p));
    void ipc.prefsGet<NotesLayout>("ui.notes_layout").then((l) => (l === "grid" || l === "list") && setLayoutState(l));
  }, []);
  const setPage = (p: Page) => {
    setPageState(p);
    setTaskFocus(null);
    void ipc.prefsSet("ui.last_view", p);
  };
  const setLayout = (l: NotesLayout) => {
    setLayoutState(l);
    void ipc.prefsSet("ui.notes_layout", l);
  };

  // App-wide shortcuts (UI brief §8): Mod+1…5 jump between pages, Mod+, opens Settings,
  // Mod+T starts a new task, Mod+M a new meeting. New note and search live on the Notes page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      const pages: Record<string, Page> = { "1": "today", "2": "tasks", "3": "notes", "4": "time", "5": "meetings", ",": "settings", t: "tasks", m: "meetings" };
      const target = pages[e.key.toLowerCase()];
      if (!target) return;
      e.preventDefault();
      setPage(target);
      if (e.key.toLowerCase() === "t") setTimeout(() => document.getElementById("new-task")?.focus(), 50);
      if (e.key.toLowerCase() === "m") setNewMeeting((n) => n + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // A due reminder also shows inside Loaf, with Done and Snooze, in case the system
  // notification was hidden (Do not disturb, notifications off for Loaf).
  useEffect(() => onEvent((e) => {
    if (e.type !== "ReminderDue") return;
    const r = e.reminder as Reminder;
    toast(r.title, {
      description: "Reminder", duration: 60_000,
      action: { label: "Done", onClick: () => void ipc.reminderSetDone(r.id, true) },
      cancel: { label: "Snooze 10 min", onClick: () => void ipc.reminderUpdate(r.id, { title: r.title, remind_at: Date.now() + 10 * 60_000 }) },
    });
  }), []);

  // From the shell: global shortcuts and the pet's menu.
  useEffect(() => onCommand((command) => {
    if (command === "new-note") void newNote();
    else if (command === "new-task") {
      setPage("tasks");
      setTimeout(() => document.getElementById("new-task")?.focus(), 80);
    } else if (command === "settings") setPage("settings");
  }));

  const newNote = async () => {
    const note = await actions.create({ label_ids: labelId ? [labelId] : [] });
    if (page !== "notes") setPage("notes");
    setEditing(note.id);
  };
  const labelName = labelId ? labels.find((l) => l.label.id === labelId)?.label.name : undefined;

  if (firstRun.show) {
    const start = async (next: WelcomeNext) => {
      await firstRun.finish();
      if (next === "note") return void newNote();
      if (next === "meeting") {
        setPage("meetings");
        setNewMeeting((n) => n + 1);
        return;
      }
      if (next === "task") {
        setPage("tasks");
        setTimeout(() => document.getElementById("new-task")?.focus(), 80);
        return;
      }
      setPage("today");
    };
    return (
      <>
        <Welcome onDone={(next) => void start(next)} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex h-screen min-h-[600px] bg-background text-foreground">
      <Sidebar
        page={page}
        counts={{ today: agenda.open, notes: allNotes.length, bin: bin.length }}
        onPage={setPage} isDark={theme.isDark} onToggleTheme={() => void theme.toggle()}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-6 py-6">
            {(page === "notes" || page === "archive") && (
              <NotesPage
                archived={page === "archive"} labelId={page === "notes" ? labelId : null} {...(labelName ? { labelName } : {})}
                labels={labels} onLabel={setLabelId}
                sort={sort} layout={layout} onSort={setSort} onLayout={setLayout}
                onOpen={setEditing} onNew={() => void newNote()} onNavigate={setPage}
              />
            )}
            {page === "today" && (
              <TodayOverviewPage onShowTasks={(focus) => { setPage("tasks"); setTaskFocus(focus); }} />
            )}
            {page === "bin" && <BinPage />}
            {page === "character" && <CharacterPage />}
            {page === "settings" && <SettingsPage />}
            {page === "tasks" && <TasksPage focus={taskFocus} onClearFocus={() => setTaskFocus(null)} />}
            {page === "meetings" && <MeetingsPage newTick={newMeeting} />}
            {page === "time" && <TimePage />}
            {page === "mcp" && <ComingSoon icon={<Plug />} title="MCP" description="Connect external tools and services to Loaf through the Model Context Protocol. This arrives in a later release." />}
          </div>
        </main>
      </div>
      <NoteEditor noteId={editing} onClose={() => setEditing(null)} />
      <Toaster />
    </div>
  );
}

export function App() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } }));
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={300}>
        <Screen />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
