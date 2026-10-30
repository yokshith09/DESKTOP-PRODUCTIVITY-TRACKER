# PLUTO

**Small companion. Big universe.**

A lightweight, local-first desktop companion for Windows and macOS: notes, tasks, meetings and an automatic daily work log, with a desktop pet.

**Progress:** [Project status](desktop-pet-docs/PROJECT_STATUS.md) · [Roadmap](desktop-pet-docs/ROADMAP.md) · [Decisions](desktop-pet-docs/DECISIONS.md) · [Changelog](desktop-pet-docs/CHANGELOG.md).

**Status:** M1 (Notes + daily work, first release) is active; foundation, notes, tasks and the dashboard are built but not yet verified on a real Windows machine. All documentation (D0–D7) is locked — start at [`desktop-pet-docs/README.md`](desktop-pet-docs/README.md). Feature specs are in [`desktop-pet-docs/docs/features/`](desktop-pet-docs/docs/features/README.md).

## Layout

| Path | What |
|------|------|
| `crates/pluto-core/` | All business logic. **Never depends on `tauri`** (ADR-002); enforced by `pnpm check:core-deps` |
| `src-tauri/` | Thin Tauri v2 shell: windows, tray, OS integration |
| `src/` | React + TypeScript frontend (`main.html`; `pet.html` is reserved for F1-22) |
| `desktop-pet-docs/` | Product, architecture, schema and plan documents |

## Develop

Prerequisites: Rust (pinned in `rust-toolchain.toml`), Node 22, pnpm 10, and the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```
pnpm install
pnpm tauri dev          # run the app
pnpm test               # frontend tests
cargo test --workspace  # Rust tests
pnpm typecheck && pnpm lint && cargo clippy --workspace --all-targets -- -D warnings
```
