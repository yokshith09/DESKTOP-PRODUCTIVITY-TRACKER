# Blockers — options to unblock each one (2026-10-22)

Every remaining blocker, the realistic ways out, a recommendation, and the **one action** that unblocks it. Tags: [Certain] checked fact · [Likely] strong inference · [Guessing] needs checking before you rely on it.

| # | Blocker | Blocks | Who acts | Recommended way out | Unblocking action |
|---|---|---|---|---|---|
| 1 | Windows test of v2.0.0 | P0 → Complete | Owner | Run the checklist | 30-60 min with `RELEASE_0.2.0_TEST.md` |
| 2 | AI provider | P6 (FR-75, FR-80, M5, M7, quiz) | Owner | Local-first hybrid | Approve a 1-day Ollama speed spike |
| 3 | Code signing | Installers, plugins, link handler | Owner | SignPath Foundation (free) if open source; else Certum / Azure Trusted Signing | Decide: open-source the repo or pay |
| 4 | D-PLUGIN-MODEL | FR-55, FR-77 | Owner | Declarative plugins first (no code) | Approve "plugins = JSON only" for v1 |
| 5 | D-MCP-SHAPE | FR-54, FR-76 | Owner | Copy OpenPets: stdio + 3 tools | Approve the shape below |
| 6 | Backend + privacy statement | FR-56 uploads, sharing, referrals | Owner | Not needed yet (gallery is static) | None now; statement drafted when needed |
| 7 | Personal-photo characters | FR-80, FR-02 | Owner | Keep on hold until #2 | — |
| 8 | Product name | Website (FR-34), store listings | Owner | Shortlist + checks | Pick 5 candidates; we check them |
| 9 | Browser tabs (FR-62) | FR-62 | Us | 1-day UI Automation spike | First task of FM-V2 build |

---

## 1. Windows test of v2.0.0
Nothing can be called Complete without it (project rule).
- **A. You run it** — `desktop-pet-docs/RELEASE_0.2.0_TEST.md`, tick each line, send failures with a screenshot. [Certain] Fastest.
- **B. A friend/classmate runs it** — same checklist; also gives a first real-user opinion.
- **C. Lean harder on CI** — our Windows e2e already runs in GitHub Actions; it cannot test tray, autostart, pet on real screens. [Certain] Not a replacement.
**Recommendation:** A now, B for v0.3.0.

## 2. AI provider
| Option | Cost | Privacy | Speed on a no-GPU PC | Effort |
|---|---|---|---|---|
| A. Local: Ollama (MIT) + small model (Llama 3.2 3B, Qwen2.5 3B) | Free | Nothing leaves the PC | [Likely] 5-15 words/s on a modern CPU; first answer 2-5 s | M |
| B. Bring your own key (OpenAI, Anthropic, Gemini) | User pays | Data goes to that company | Fast | S |
| C. We host the AI | We pay per user | Data goes to us | Fast | L + backend + billing |
| D. **Hybrid A + B** | Free by default | Local by default, cloud only if the user adds a key | Fast when keyed | M |

**Recommendation: D.** Matches local-first, costs us nothing, works for students without money. **Unblock:** let us do a 1-day spike measuring Ollama on your PC (task-from-sentence and note summary, timed). If it's too slow, B alone.
- Voice later (M9): whisper.cpp (MIT) for speech-to-text, Piper (MIT) for speech — both run on CPU. [Likely]

## 3. Code signing
| Option | Cost | Condition | Notes |
|---|---|---|---|
| A. **SignPath Foundation** | Free | Project must be open source (OSI licence), public repo, builds in CI | [Certain] OpenPets' Windows installer is signed through SignPath |
| B. Certum Open Source code-signing cert | [Guessing] ~€25-70/yr + card reader | Individual open-source developer | Shows your name as publisher |
| C. Azure Trusted Signing | [Likely] ~US$10/month | Identity validation; availability for individuals limited by country, easier as a company (QUORBIT TECHNOLOGIES) | Microsoft-run, CI friendly |
| D. Standard OV certificate (Sectigo, DigiCert…) | [Likely] US$200-500/yr | Company documents | SmartScreen warning fades with downloads |
| E. Stay unsigned | Free | — | SmartScreen "unknown publisher" warning on every install |
| macOS | US$99/yr Apple Developer | Apple ID | Needed for notarization; without it Mac users must right-click → Open |

**Recommendation:** decide whether Loaf will be open source. If yes → **A (free)**. If no → **C** through QUORBIT TECHNOLOGIES. **Unblock:** your yes/no on open source (licence suggestion: MIT or Apache-2.0, same family as OpenPets).

## 4. Plugin model
| Option | Safety | Needs signing? | Power |
|---|---|---|---|
| A. No third-party plugins (built-ins only) | Highest | No | Low |
| B. **Declarative plugins** — JSON only: menu items, timers, reminders, bubbles, links, sounds; no code | High (nothing runs) | No | Medium — covers water reminder, routines, fortune-style packs |
| C. Sandboxed JavaScript like OpenPets SDK v3 (separate process, declared permissions, host-drawn UI) | Medium | Yes (or a review process) | High |
| D. WebAssembly plugins | Medium-high | Yes | High, hardest to build |

**Recommendation:** B now (safe without signing, shares FR-63's validator idea), C after signing. **Unblock:** approve B.

## 5. Local MCP shape
**Proposal (copy what works in OpenPets):**
- Transport: **stdio** (`loaf mcp` command started by the agent) → talks to the running app over a **named pipe** with a per-run token. No network port opened.
- Tools: `loaf_status`, `loaf_react` (thinking / working / testing / success / error), `loaf_say` (short text; code, paths, URLs, secrets refused).
- Later, read tools for your data (`loaf_tasks_list`, `loaf_note_search`) — **off by default**, user approves each.
**Unblock:** approve this shape.

## 6. Backend and privacy statement
- [Certain] The gallery no longer needs a backend (GitHub Pages, static, decided).
- A backend is only needed for: user uploads, sharing, referrals, leaderboards, telemetry. None are in P1-P5.
- **Options when needed:** Supabase (Postgres + auth, free tier), Cloudflare Workers + D1 (free tier), own server. Privacy statement: one page — what is collected, why, where stored, how to delete — written before the first byte is collected.
**Recommendation:** leave closed until P7. No action now.

## 7. Personal-photo characters
Needs an image model ([Certain] no GPU → cloud) and a privacy review of face photos. **Ways:** (a) cloud AI with explicit consent and no storage, (b) "draw-your-own" in the Studio by picking parts (no photo, no AI — could ship earlier), (c) keep holding. **Recommendation:** (b) as a stepping stone; (a) after #2.

## 8. Product name
**Way:** you give 5-10 candidates → we check: domain (.app/.com), Microsoft Store and app-store names, GitHub org, existing trademarks (India IP office, USPTO, EUIPO search). [Certain] "Loaf" is the working name only.

## 9. Browser tabs spike (ours)
Day 1 of FM-V2 build: list Chrome/Edge tabs via Windows UI Automation. Result recorded in PROJECT_STATUS; if it fails, the fallback is showing **browser windows** (not tabs) with switch/close, which always works.
