import { Toaster as Sonner, type ToasterProps } from "sonner";
import { MAX_VISIBLE, TOAST_MS } from "@/lib/notify";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      // FR-41: one stack, bottom-right, at most three cards, each closable and paused on hover.
      position="bottom-right"
      visibleToasts={MAX_VISIBLE}
      duration={TOAST_MS}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!bg-popover !text-popover-foreground !border !border-border !rounded-xl !shadow-xl",
          actionButton: "!bg-primary !text-primary-foreground !font-semibold",
        },
      }}
      {...props}
    />
  );
}
