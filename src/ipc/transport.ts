import { invoke, isTauri } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import type { AppError, LoafEvent } from "./types";

type Handler = (cmd: string, args: Record<string, unknown> | undefined) => Promise<unknown>;
type Subscribe = (cb: (e: LoafEvent) => void) => () => void;

type Mock = { call: Handler; subscribe: Subscribe };
// One shared promise: concurrent first calls must get the same in-memory shell, not one each.
let mock: Promise<Mock | null> | null = null;

/** In `vite dev` outside Tauri the UI runs against an in-memory fake, so the screens can be
 *  designed and screenshotted without the Rust shell. It is dead code in production builds (unless built with VITE_MOCK for design previews). */
function loadMock(): Promise<Mock | null> {
  mock ??= import.meta.env.DEV || import.meta.env.VITE_MOCK ? import("./mock").then((m) => m.createMock()) : Promise.resolve(null);
  return mock;
}

export async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) return (await invoke<T>(cmd, args)) as T;
  const m = await loadMock();
  if (!m) throw new Error("Loaf's shell isn't available.");
  return (await m.call(cmd, args)) as T;
}

export function onEvent(cb: (e: LoafEvent) => void): () => void {
  if (isTauri()) {
    const pending = listen<LoafEvent>("loaf://event", (e) => cb(e.payload));
    return () => void pending.then((off) => off());
  }
  let off: (() => void) | undefined;
  let cancelled = false;
  void loadMock().then((m) => {
    if (m && !cancelled) off = m.subscribe(cb);
  });
  return () => {
    cancelled = true;
    off?.();
  };
}

export function errorMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as AppError).message);
  return typeof e === "string" ? e : "Something went wrong. Your data is safe.";
}

/** Requests from the shell to the dashboard (`new-note`, `new-task`, `settings`): global shortcuts and the pet menu. */
export function onCommand(cb: (command: string) => void): () => void {
  if (!isTauri()) return () => {};
  const pending = listen<string>("loaf://command", (e) => cb(e.payload));
  return () => void pending.then((off) => off());
}

/**
 * Typing started (`true`) or stopped (`false`) anywhere on the computer; only sent to the pet
 * window while `pet.typing` is on. Outside the app (browser preview, tests) a `loaf-typing`
 * window event with `detail: boolean` stands in for it.
 */
export function onTyping(cb: (typing: boolean) => void): () => void {
  if (isTauri()) {
    const pending = listen<boolean>("pet://typing", (e) => cb(e.payload));
    return () => void pending.then((off) => off());
  }
  const handler = (e: Event) => cb(Boolean((e as CustomEvent<boolean>).detail));
  window.addEventListener("loaf-typing", handler);
  return () => window.removeEventListener("loaf-typing", handler);
}

/**
 * Whether a text box has the focus in the app in front, while `pet.typing` is on. Sent only
 * when it changes and only where the OS can tell (never on macOS without Accessibility).
 * Outside the app a `loaf-textbox` window event with `detail: boolean` stands in for it.
 */
export function onTextBox(cb: (focused: boolean) => void): () => void {
  if (isTauri()) {
    const pending = listen<boolean>("pet://textbox", (e) => cb(e.payload));
    return () => void pending.then((off) => off());
  }
  const handler = (e: Event) => cb(Boolean((e as CustomEvent<boolean>).detail));
  window.addEventListener("loaf-textbox", handler);
  return () => window.removeEventListener("loaf-textbox", handler);
}

/** Something the dashboard asks the pet to say above its head (FR-43), e.g. the routine reminder. */
export interface PetSay { text: string; pose?: string; ms?: number; actionId?: string; actionLabel?: string }

/**
 * Dashboard → pet window message (FR-85/FR-43). In the app it is a Tauri event to every window;
 * outside it (browser preview, tests) a `loaf-pet-say` window event stands in for it.
 */
export async function petSay(say: PetSay): Promise<void> {
  if (isTauri()) return emit("pet://say", say);
  window.dispatchEvent(new CustomEvent<PetSay>("loaf-pet-say", { detail: say }));
}

export function onPetSay(cb: (say: PetSay) => void): () => void {
  if (isTauri()) {
    const pending = listen<PetSay>("pet://say", (e) => cb(e.payload));
    return () => void pending.then((off) => off());
  }
  const handler = (e: Event) => cb((e as CustomEvent<PetSay>).detail);
  window.addEventListener("loaf-pet-say", handler);
  return () => window.removeEventListener("loaf-pet-say", handler);
}

/**
 * The computer woke up (the shell noticed a long gap between its once-a-minute looks).
 * Reminders and the daily greeting re-check then (bug S1). Outside the app a `loaf-wake`
 * window event stands in for it.
 */
export function onWake(cb: () => void): () => void {
  if (isTauri()) {
    const pending = listen("loaf://wake", () => cb());
    return () => void pending.then((off) => off());
  }
  window.addEventListener("loaf-wake", cb);
  return () => window.removeEventListener("loaf-wake", cb);
}

/** Pet → dashboard: the bubble's action (e.g. Undo) was clicked. Outside the app a
 *  `loaf-pet-action` window event stands in for it. */
export async function petAction(id: string): Promise<void> {
  if (isTauri()) return emit("pet://action", id);
  window.dispatchEvent(new CustomEvent<string>("loaf-pet-action", { detail: id }));
}

export function onPetAction(cb: (id: string) => void): () => void {
  if (isTauri()) {
    const pending = listen<string>("pet://action", (e) => cb(e.payload));
    return () => void pending.then((off) => off());
  }
  const handler = (e: Event) => cb((e as CustomEvent<string>).detail);
  window.addEventListener("loaf-pet-action", handler);
  return () => window.removeEventListener("loaf-pet-action", handler);
}
