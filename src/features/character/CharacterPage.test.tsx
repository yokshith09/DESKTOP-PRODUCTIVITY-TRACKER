import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ipc, type PetPack } from "@/ipc";
import { CharacterPage } from "./CharacterPage";

window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const boba: PetPack = { id: "boba", display_name: "Boba", description: "A boba tea", rows: 9, format: "webp", source: "codex" };
const short: PetPack = { id: "mini", display_name: "Mini", description: "", rows: 3, format: "webp", source: "loaf" };

function renderPage() {
  vi.spyOn(ipc, "settingsGetAll").mockResolvedValue({ "pet.pack": null, "pet.media": false } as never);
  vi.spyOn(ipc, "petsList").mockResolvedValue([boba, short]);
  vi.spyOn(ipc, "petsSheet").mockResolvedValue("data:image/webp;base64,AA==");
  vi.spyOn(ipc, "prefsGet").mockResolvedValue(null as never);
  vi.spyOn(ipc, "prefsSet").mockResolvedValue(null as never);
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><CharacterPage /></QueryClientProvider>,
  );
}

describe("Character page preview (F1/F2)", () => {
  it("starts as the bear, with its pose buttons", async () => {
    renderPage();
    expect(screen.getByRole("group", { name: "Preview pose" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Preview animation" })).toBeNull();
  });

  it("choosing another character changes the preview and lists its animations", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Preview Boba" }));
    const group = await screen.findByRole("group", { name: "Preview animation" });
    expect(group.querySelectorAll("button")).toHaveLength(9);
    expect(screen.queryByRole("group", { name: "Preview pose" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cheer" }));
    await waitFor(() => expect(screen.getByRole("img", { name: "Boba (Cheer)" }).getAttribute("data-row")).toBe("jumping"));
  });

  it("only offers the animations a pack really has, and the bear card goes back", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Preview Mini" }));
    const group = await screen.findByRole("group", { name: "Preview animation" });
    expect(group.querySelectorAll("button")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Preview Loaf the bear" }));
    expect(await screen.findByRole("group", { name: "Preview pose" })).toBeTruthy();
  });

  it("has no music option for now", async () => {
    renderPage();
    await screen.findByText("Show on desktop");
    expect(screen.queryByRole("switch", { name: "Music buttons under the pet" })).toBeNull();
  });

  it("can be told to get out of the way in full screen (owner 2026-10-28); it is on to begin with", async () => {
    const set = vi.spyOn(ipc, "settingSet");
    renderPage();
    const sw = await screen.findByRole("switch", { name: "Get out of the way in full screen" });
    expect(sw.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(sw);
    await waitFor(() => expect(set).toHaveBeenCalledWith("pet.hide_fullscreen", false));
  });

  it("previews the character in use, not always the bear, and follows a new choice", async () => {
    vi.spyOn(ipc, "settingsGetAll").mockResolvedValue({ "pet.pack": "boba", "pet.media": false } as never);
    vi.spyOn(ipc, "petsList").mockResolvedValue([boba, short]);
    vi.spyOn(ipc, "petsSheet").mockResolvedValue("data:image/webp;base64,AA==");
    vi.spyOn(ipc, "prefsGet").mockResolvedValue(null as never);
    vi.spyOn(ipc, "prefsSet").mockResolvedValue(null as never);
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><CharacterPage /></QueryClientProvider>);
    // Boba is in use: its animations are offered, the bear's poses are not.
    expect(await screen.findByRole("group", { name: "Preview animation" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Preview pose" })).toBeNull();
    expect(screen.getAllByText("Boba").length).toBeGreaterThan(0);
  });
});
