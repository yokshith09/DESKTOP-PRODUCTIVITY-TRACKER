import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ERROR_MS, TOAST_MS, notify } from "./notify";

vi.mock("sonner", () => {
  const t = Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() });
  return { toast: t };
});
afterEach(() => vi.clearAllMocks());

describe("notify (FR-41)", () => {
  it("shows success and info cards for 5 seconds", () => {
    notify.success("Task added", { description: "Read chapter 3" });
    expect(toast.success).toHaveBeenCalledWith("Task added", { duration: TOAST_MS, description: "Read chapter 3" });
    notify.info("Moved to Bin");
    expect(toast).toHaveBeenCalledWith("Moved to Bin", { duration: TOAST_MS });
    expect(TOAST_MS).toBe(5000);
  });

  it("keeps errors longer", () => {
    notify.error("Could not save");
    expect(toast.error).toHaveBeenCalledWith("Could not save", { duration: ERROR_MS });
    expect(ERROR_MS).toBeGreaterThan(TOAST_MS);
  });

  it("puts an action such as Undo on the card", () => {
    const undo = vi.fn();
    notify.info("Moved to Bin", { action: { label: "Undo", onClick: undo } });
    const call = vi.mocked(toast).mock.calls[0];
    expect(call?.[1]).toMatchObject({ action: { label: "Undo" } });
  });
});
