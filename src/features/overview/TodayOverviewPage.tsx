import { LinksCard } from "@/features/links/Shortcuts";
import { RoutineCard } from "@/features/routine/RoutineCard";
import { TimeHero } from "@/features/time/TimeHero";
import { FocusTile } from "@/features/focus/FocusTile";
import { dayLabel } from "@/lib/dates";
import { greeting } from "@/lib/time";
import { AgendaCard } from "./AgendaCard";
import { MovableTiles, type TileId } from "./MovableTiles";
import { QuoteOfTheDay } from "./QuoteOfTheDay";
import { useAgenda } from "./TodayAgenda";
import { YesterdayLine, type TaskFocus } from "./YesterdayLine";

/** Today: the day's list, focus, routine, time and links (owner 2026-10-25: no activity feed, no week count). */
export function TodayOverviewPage({ onShowTasks = () => {} }: { onShowTasks?: (focus: TaskFocus) => void }) {
  const agenda = useAgenda();
  const now = new Date();
  const flagged = agenda.overdue + agenda.missed;

  const tiles: Record<TileId, { span: string; sizes?: { s: string; l: string }; node: React.ReactNode; title: string }> = {
    agenda: { span: "md:col-span-2 lg:col-span-7 lg:row-span-2", sizes: { s: "md:col-span-2 lg:col-span-5 lg:row-span-2", l: "md:col-span-2 lg:col-span-12 lg:row-span-2" }, title: "Today", node: <AgendaCard className="h-full" /> },
    focus: { span: "lg:col-span-5", sizes: { s: "lg:col-span-4", l: "lg:col-span-7" }, title: "Focus", node: <FocusTile className="h-full" /> },
    routine: { span: "lg:col-span-5", sizes: { s: "lg:col-span-4", l: "lg:col-span-7" }, title: "Daily routine", node: <RoutineCard className="h-full" /> },
    time: { span: "md:col-span-2 lg:col-span-8 lg:row-span-2", sizes: { s: "md:col-span-2 lg:col-span-6 lg:row-span-2", l: "md:col-span-2 lg:col-span-12 lg:row-span-2" }, title: "Total time today", node: <TimeHero className="h-full" /> },
    links: { span: "lg:col-span-4 lg:row-span-2", sizes: { s: "lg:col-span-3 lg:row-span-2", l: "lg:col-span-6 lg:row-span-2" }, title: "Links", node: <LinksCard className="h-full" /> },
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 pt-1">
          <h1 className="text-2xl font-semibold tracking-tight">{greeting(now.getHours())}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {dayLabel(now)} · {agenda.open} open{flagged ? <> · <span className="text-destructive">{flagged} overdue or missed</span></> : null}
          </p>
          <YesterdayLine onShow={onShowTasks} className="mt-2" />
        </div>
        <QuoteOfTheDay className="w-full sm:w-auto sm:min-w-80 sm:flex-1 lg:flex-none lg:w-[30rem]" />
      </header>
      <MovableTiles tiles={tiles} />
    </div>
  );
}
