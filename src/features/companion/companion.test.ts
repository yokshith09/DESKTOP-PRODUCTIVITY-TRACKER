import { describe, expect, it } from "vitest";
import { ageDays, ageLabel, birthdayToday, emptyCompanion, greetingFor, parseCompanion, todaysGreeting } from "./companion";

const day = (s: string, h = 9) => new Date(`${s}T${String(h).padStart(2, "0")}:00:00`);

describe("pet that ages and remembers (FR-93, FR-94)", () => {
  it("starts its life on the first day and counts real days", () => {
    const c = emptyCompanion("2026-10-01");
    expect(ageDays(c, day("2026-10-01"))).toBe(0);
    expect(ageDays(c, day("2026-10-24"))).toBe(23);
    expect(ageLabel(c, day("2026-10-01"))).toBe("born today");
    expect(ageLabel(c, day("2026-10-02"))).toBe("1 day old");
    expect(ageLabel(c, day("2026-10-24"))).toBe("23 days old");
    expect(ageLabel(c, day("2027-10-01"))).toBe("1 year old");
    expect(ageLabel(c, day("2028-12-01"))).toBe("2 years old");
  });

  it("knows the user's and its own birthday (day and month only)", () => {
    const c = { ...emptyCompanion("2025-10-23"), userName: "Asha", userBirthday: "03-14" };
    expect(birthdayToday(c, day("2026-03-14"))).toBe("user");
    expect(birthdayToday(c, day("2026-10-23"))).toBe("pet");
    expect(birthdayToday(c, day("2025-10-23"))).toBeNull(); // the day it was born isn't a birthday
    expect(birthdayToday(c, day("2026-05-01"))).toBeNull();
  });

  it("greets by time of day, with the name when known, kindly", () => {
    const c = { ...emptyCompanion("2026-10-01"), userName: "Asha" };
    expect(greetingFor(c, day("2026-10-23", 8))).toBe("Good morning, Asha!");
    expect(greetingFor(c, day("2026-10-23", 14))).toBe("Good afternoon, Asha!");
    expect(greetingFor(c, day("2026-10-23", 20))).toBe("Good evening, Asha!");
    expect(greetingFor(emptyCompanion("2026-10-01"), day("2026-10-23", 8))).toBe("Good morning!");
  });

  it("gives at most one greeting a day, birthdays first", () => {
    const c = { ...emptyCompanion("2025-10-23"), userName: "Asha", userBirthday: "10-23" };
    expect(todaysGreeting(c, day("2026-10-23"))).toEqual({ kind: "birthday-user", text: "Happy birthday, Asha! 🎂", pose: "party" });
    expect(todaysGreeting({ ...c, greetedOn: "2026-10-23" }, day("2026-10-23"))).toBeNull();
    const pet = { ...emptyCompanion("2025-10-23") };
    expect(todaysGreeting(pet, day("2026-10-23"))?.text).toBe("I'm 1 today! Thanks for having me 🎂");
    expect(todaysGreeting(pet, day("2026-10-24"))).toEqual({ kind: "greeting", text: "Good morning!", pose: "wave" });
    expect(todaysGreeting({ ...pet, greet: false }, day("2026-10-24"))).toBeNull();
  });

  it("reads broken stored data safely", () => {
    const c = parseCompanion({ born: "nope", userBirthday: "13-40", userName: 5 }, "2026-10-23");
    expect(c).toEqual(emptyCompanion("2026-10-23"));
    expect(parseCompanion({ born: "2026-01-01", userName: " Asha ", userBirthday: "03-14" }, "2026-10-23")).toMatchObject({ born: "2026-01-01", userName: "Asha", userBirthday: "03-14" });
  });
});
