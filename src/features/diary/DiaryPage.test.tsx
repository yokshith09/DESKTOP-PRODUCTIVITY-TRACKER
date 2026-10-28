import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ipc } from "@/ipc";
import { DiaryPage } from "./DiaryPage";

beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const wrap = () => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><DiaryPage /></QueryClientProvider>;
const type = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name), { target: { value } });

describe("the diary page", () => {
  it("asks for a password first, warns that it cannot be recovered, and wants it typed twice", async () => {
    await ipc.diaryErase();
    render(wrap());
    expect(await screen.findByText("Set a password for your diary")).toBeTruthy();
    expect(screen.getByText(/nobody can recover the entries/)).toBeTruthy();
    type("Password", "secret pass");
    type("Repeat the password", "other pass");
    fireEvent.click(screen.getByRole("button", { name: "Create diary" }));
    expect((await screen.findByRole("alert")).textContent).toContain("not the same");
    type("Repeat the password", "secret pass");
    fireEvent.click(screen.getByRole("button", { name: "Create diary" }));
    expect(await screen.findByRole("textbox", { name: "Diary text" })).toBeTruthy();
  });

  it("saves what you write by itself, locks on request, and opens again only with the right password", async () => {
    await ipc.diaryErase();
    await ipc.diarySetup("secret pass");
    render(wrap());
    const area = (await screen.findByRole("textbox", { name: "Diary text" })) as HTMLTextAreaElement;
    await waitFor(() => expect(area.disabled).toBe(false));
    fireEvent.change(area, { target: { value: "Dear diary, today was calm." } });
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy(), { timeout: 3000 });
    expect(await ipc.diaryDays()).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Lock now/ }));
    expect(await screen.findByText("Unlock your diary")).toBeTruthy();
    expect(screen.queryByText(/Dear diary/)).toBeNull();

    type("Password", "wrong");
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    expect((await screen.findByRole("alert")).textContent).toContain("not the right password");
    type("Password", "secret pass");
    fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
    const again = (await screen.findByRole("textbox", { name: "Diary text" })) as HTMLTextAreaElement;
    await waitFor(() => expect(again.value).toBe("Dear diary, today was calm."));
  });

  it("underlines to-dos only when asked, and Make task adds the task with the date read from the words", async () => {
    await ipc.diaryErase();
    await ipc.diarySetup("secret pass");
    const add = vi.spyOn(ipc, "taskQuickAdd");
    const update = vi.spyOn(ipc, "taskUpdate");
    render(wrap());
    const area = (await screen.findByRole("textbox", { name: "Diary text" })) as HTMLTextAreaElement;
    await waitFor(() => expect(area.disabled).toBe(false));
    fireEvent.change(area, { target: { value: "Long day.\nI need to submit the lab report tomorrow." } });
    expect(screen.queryByRole("list", { name: "Things that look like to-dos" })).toBeNull();

    fireEvent.click(screen.getByRole("switch", { name: "Spot things to do" }));
    const list = await screen.findByRole("list", { name: "Things that look like to-dos" });
    expect(within(list).getByText(/Submit the lab report/)).toBeTruthy();
    fireEvent.click(within(list).getByRole("button", { name: "Make task" }));
    await waitFor(() => expect(add).toHaveBeenCalledWith("Submit the lab report"));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0]?.[1].due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await within(list).findByText("Task made")).toBeTruthy();
  });

  it("erasing a forgotten diary asks first", async () => {
    await ipc.diaryErase();
    await ipc.diarySetup("secret pass");
    await ipc.diaryLock();
    render(wrap());
    fireEvent.click(await screen.findByRole("button", { name: "Erase the diary" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect((await ipc.diaryStatus()).configured).toBe(true);
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Erase" }));
    expect(await screen.findByText("Set a password for your diary")).toBeTruthy();
  });
});
