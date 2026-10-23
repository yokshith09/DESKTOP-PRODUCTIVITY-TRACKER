import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { useTaskActions } from "@/hooks/useLoaf";
import { cn } from "@/lib/utils";
import type { Task } from "@/ipc";

/** Two-step delete for a task row: the first click asks, the second deletes. Resets after 3 s. */
export function DeleteTaskButton({ task, className }: { task: Task; className?: string }) {
  const { removeAny } = useTaskActions();
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!asking) return;
    const t = setTimeout(() => setAsking(false), 3000);
    return () => clearTimeout(t);
  }, [asking]);

  return asking ? (
    <button
      type="button" aria-label={`Confirm delete ${task.title}`} onClick={() => void removeAny(task).then(() => notify.info(`Deleted “${task.title}”`))}
      className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium text-destructive outline-none hover:bg-destructive/15 focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      Delete?
    </button>
  ) : (
    <button
      type="button" aria-label={`Delete ${task.title}`} title="Delete task" onClick={() => setAsking(true)}
      className={cn("grid size-6 shrink-0 place-items-center rounded text-muted-foreground opacity-0 outline-none hover:bg-destructive/15 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100", className)}
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
