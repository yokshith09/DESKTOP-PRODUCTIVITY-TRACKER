import { Pause, Play, Plus, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocus } from "@/hooks/useFocus";
import { FOCUS_CHOICES, clock } from "@/lib/focus";
import { cn } from "@/lib/utils";

/**
 * Focus from Today (FR-05): start 15/25/50 minutes, or, while one runs, see the time left with
 * Pause, +5 and Stop. The same timer shows by the pet (FR-110).
 */
export function FocusBar({ className }: { className?: string }) {
  const { session, remaining, start, pause, extend, stop } = useFocus();
  if (!session) {
    return (
      <div className={cn("flex items-center gap-2", className)} role="group" aria-label="Focus">
        <Timer className="size-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Focus</span>
        {FOCUS_CHOICES.map((m) => (
          <Button key={m} type="button" size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => void start("FOCUS", m)} aria-label={`Focus ${m} minutes`}>{m} min</Button>
        ))}
      </div>
    );
  }
  const paused = session.paused_at !== null;
  const what = session.kind === "BREAK" ? "Break" : session.label ? `Focusing · ${session.label}` : "Focusing";
  return (
    <div className={cn("flex items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-1.5", className)} role="group" aria-label="Focus session">
      <span className={cn("size-2 rounded-full", paused ? "bg-muted-foreground" : session.kind === "BREAK" ? "bg-success" : "bg-primary animate-pulse")} />
      <span className="min-w-0 truncate text-xs font-medium">{what}</span>
      <span className="ml-auto text-sm font-semibold tabular-nums" role="timer" aria-label="Time left">{clock(remaining)}</span>
      <Button type="button" size="icon" variant="ghost" className="size-7" aria-label={paused ? "Resume" : "Pause"} onClick={() => void pause(!paused)}>{paused ? <Play /> : <Pause />}</Button>
      <Button type="button" size="icon" variant="ghost" className="size-7" aria-label="Add 5 minutes" onClick={() => void extend(5)}><Plus /></Button>
      <Button type="button" size="icon" variant="ghost" className="size-7" aria-label="Stop" onClick={() => void stop()}><Square /></Button>
    </div>
  );
}
