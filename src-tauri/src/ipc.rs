//! IPC command handlers. Thin: deserialize, call `loaf-core`, return. Errors cross the boundary
//! as `AppError` (`{ code, message, field? }`).

use std::collections::BTreeMap;
use std::sync::Arc;

use loaf_core::clock::Clock;
use loaf_core::daily_log::{self, DailyLog};
use loaf_core::data;
use loaf_core::error::{AppError, Result};
use loaf_core::events::Event;
use loaf_core::labels::{self, Label, LabelCount};
use loaf_core::links;
use loaf_core::meetings::{self, Meeting, MeetingFilters, MeetingInput, MeetingSummary};
use loaf_core::notes::{self, BinNote, Note, NoteInput, NotePatch, NoteSort, NoteSummary};
use loaf_core::reminders::{self, Reminder, ReminderInput, ReminderPatch};
use loaf_core::settings::SettingsKey;
use loaf_core::settings_service::SettingsService;
use loaf_core::tasks::{
    self, Task, TaskEdit, TaskEvent, TaskFilters, TaskRow, TaskStatus, TaskView, WorkUpdate,
};
use loaf_core::usage::{DomainSetting, TimeRange, TrackingStatus, UsageService, UsageSummary};
use serde_json::Value;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

use crate::tracking::Tracking;
use crate::Core;

// ---- settings and preferences ---------------------------------------------------------------

#[tauri::command]
pub async fn settings_get_all(
    service: State<'_, Arc<SettingsService>>,
) -> Result<BTreeMap<String, Value>> {
    service.get_all().await
}

#[tauri::command]
pub async fn setting_set(
    key: String,
    value: Value,
    service: State<'_, Arc<SettingsService>>,
) -> Result<()> {
    service.set(&key, value).await
}

#[tauri::command]
pub async fn prefs_get(
    key: String,
    service: State<'_, Arc<SettingsService>>,
) -> Result<Option<Value>> {
    service.get_pref(&key).await
}

#[tauri::command]
pub async fn prefs_set(
    key: String,
    value: Value,
    service: State<'_, Arc<SettingsService>>,
) -> Result<()> {
    service.set_pref(&key, value).await
}

// ---- notes ----------------------------------------------------------------------------------

#[tauri::command]
pub async fn notes_list(
    archived: bool,
    label_id: Option<String>,
    sort: Option<NoteSort>,
    core: State<'_, Core>,
) -> Result<Vec<NoteSummary>> {
    notes::list(
        &core.db,
        archived,
        label_id.as_deref(),
        sort.unwrap_or_default(),
    )
    .await
}

#[tauri::command]
pub async fn note_get(id: String, core: State<'_, Core>) -> Result<Note> {
    notes::get(&core.db, &id).await
}

#[tauri::command]
pub async fn note_create(input: NoteInput, core: State<'_, Core>) -> Result<Note> {
    notes::create(&core.db, &*core.clock, input).await
}

#[tauri::command]
pub async fn note_update(id: String, patch: NotePatch, core: State<'_, Core>) -> Result<Note> {
    notes::update(&core.db, &*core.clock, &id, patch).await
}

#[tauri::command]
pub async fn note_set_pinned(id: String, pinned: bool, core: State<'_, Core>) -> Result<Note> {
    notes::set_pinned(&core.db, &*core.clock, &id, pinned).await
}

#[tauri::command]
pub async fn note_set_archived(id: String, archived: bool, core: State<'_, Core>) -> Result<Note> {
    notes::set_archived(&core.db, &*core.clock, &id, archived).await
}

/// Moves the note to the Bin and returns it, so the UI can offer Undo via `note_restore`.
#[tauri::command]
pub async fn note_delete(id: String, core: State<'_, Core>) -> Result<Note> {
    notes::delete(&core.db, &*core.clock, &id).await
}

/// Takes a note out of the Bin.
#[tauri::command]
pub async fn note_restore(id: String, core: State<'_, Core>) -> Result<Note> {
    notes::restore_from_bin(&core.db, &*core.clock, &id).await
}

#[tauri::command]
pub async fn notes_search(
    query: String,
    archived: bool,
    core: State<'_, Core>,
) -> Result<Vec<NoteSummary>> {
    notes::search(&core.db, &query, archived).await
}

#[tauri::command]
pub async fn bin_list(core: State<'_, Core>) -> Result<Vec<BinNote>> {
    notes::list_bin(&core.db).await
}

/// Deletes one binned note for good.
#[tauri::command]
pub async fn note_purge(id: String, core: State<'_, Core>) -> Result<()> {
    notes::purge(&core.db, &*core.clock, &id).await
}

/// Empties the Bin; returns how many notes were removed.
#[tauri::command]
pub async fn bin_empty(core: State<'_, Core>) -> Result<u64> {
    notes::empty_bin(&core.db, &*core.clock).await
}

#[tauri::command]
pub async fn note_discard_if_empty(id: String, core: State<'_, Core>) -> Result<bool> {
    notes::discard_if_empty(&core.db, &*core.clock, &id).await
}

// ---- meetings (TRD §4.3) --------------------------------------------------------------------

#[tauri::command]
pub async fn meetings_list(
    filters: MeetingFilters,
    core: State<'_, Core>,
) -> Result<Vec<MeetingSummary>> {
    meetings::list(&core.db, filters).await
}

#[tauri::command]
pub async fn meeting_get(id: String, core: State<'_, Core>) -> Result<Meeting> {
    meetings::get(&core.db, &id).await
}

#[tauri::command]
pub async fn meeting_create(input: MeetingInput, core: State<'_, Core>) -> Result<Meeting> {
    meetings::create(&core.db, &*core.clock, input).await
}

#[tauri::command]
pub async fn meeting_update(
    id: String,
    input: MeetingInput,
    core: State<'_, Core>,
) -> Result<Meeting> {
    meetings::update(&core.db, &*core.clock, &id, input).await
}

#[tauri::command]
pub async fn meeting_delete(id: String, core: State<'_, Core>) -> Result<()> {
    meetings::delete(&core.db, &*core.clock, &id).await
}

#[tauri::command]
pub async fn action_item_convert(action_item_id: String, core: State<'_, Core>) -> Result<Task> {
    meetings::convert_action_item(&core.db, &*core.clock, &action_item_id).await
}

#[tauri::command]
pub async fn participants_suggest(prefix: String, core: State<'_, Core>) -> Result<Vec<String>> {
    meetings::suggest_participants(&core.db, &prefix).await
}

// ---- reminders ------------------------------------------------------------------------------

#[tauri::command]
pub async fn reminders_list(include_done: bool, core: State<'_, Core>) -> Result<Vec<Reminder>> {
    reminders::list(&core.db, include_done).await
}

#[tauri::command]
pub async fn reminder_create(input: ReminderInput, core: State<'_, Core>) -> Result<Reminder> {
    reminders::create(&core.db, &*core.clock, input).await
}

#[tauri::command]
pub async fn reminder_update(
    id: String,
    patch: ReminderPatch,
    core: State<'_, Core>,
) -> Result<Reminder> {
    reminders::update(&core.db, &*core.clock, &id, patch).await
}

#[tauri::command]
pub async fn reminder_set_done(id: String, done: bool, core: State<'_, Core>) -> Result<Reminder> {
    reminders::set_done(&core.db, &*core.clock, &id, done).await
}

#[tauri::command]
pub async fn reminder_delete(id: String, core: State<'_, Core>) -> Result<()> {
    reminders::delete(&core.db, &*core.clock, &id).await
}

// ---- labels ---------------------------------------------------------------------------------

#[tauri::command]
pub async fn labels_list(core: State<'_, Core>) -> Result<Vec<LabelCount>> {
    labels::list(&core.db).await
}

#[tauri::command]
pub async fn label_create(name: String, core: State<'_, Core>) -> Result<Label> {
    labels::create(&core.db, &*core.clock, &name).await
}

#[tauri::command]
pub async fn label_rename(id: String, name: String, core: State<'_, Core>) -> Result<Label> {
    labels::rename(&core.db, &*core.clock, &id, &name).await
}

#[tauri::command]
pub async fn label_delete(id: String, core: State<'_, Core>) -> Result<()> {
    labels::delete(&core.db, &*core.clock, &id).await
}

// ---- tasks (the Today card; the full Tasks screen is CP1 UI) --------------------------------

#[tauri::command]
pub async fn tasks_query(
    view: TaskView,
    filters: Option<TaskFilters>,
    core: State<'_, Core>,
) -> Result<Vec<TaskRow>> {
    tasks::query(&core.db, &*core.clock, view, filters.unwrap_or_default()).await
}

#[tauri::command]
pub async fn task_quick_add(title: String, core: State<'_, Core>) -> Result<Task> {
    tasks::quick_add(&core.db, &*core.clock, &title).await
}

#[tauri::command]
pub async fn task_transition(id: String, to: TaskStatus, core: State<'_, Core>) -> Result<Task> {
    tasks::transition(&core.db, &*core.clock, &id, to).await
}

/// Edit a task's title, priority, planned day and deadline in one go.
#[tauri::command]
pub async fn task_update(id: String, edit: TaskEdit, core: State<'_, Core>) -> Result<Task> {
    tasks::update(&core.db, &*core.clock, &id, edit.into()).await
}

#[tauri::command]
pub async fn task_get(id: String, core: State<'_, Core>) -> Result<Task> {
    tasks::get(&core.db, &id).await
}

/// Everything that happened to a task, oldest first.
#[tauri::command]
pub async fn task_history(id: String, core: State<'_, Core>) -> Result<Vec<TaskEvent>> {
    tasks::history(&core.db, &id).await
}

/// Move the planned day later. `to` is a local day `YYYY-MM-DD`.
#[tauri::command]
pub async fn task_defer(id: String, to: String, core: State<'_, Core>) -> Result<Task> {
    let day = chrono::NaiveDate::parse_from_str(&to, "%Y-%m-%d")
        .map_err(|_| AppError::validation("to", "Dates look like 2026-10-04."))?;
    tasks::defer(&core.db, &*core.clock, &id, day).await
}

/// Only finished (completed or cancelled) tasks can be deleted.
#[tauri::command]
pub async fn task_delete(id: String, core: State<'_, Core>) -> Result<()> {
    tasks::delete(&core.db, &*core.clock, &id).await
}

#[tauri::command]
pub async fn work_updates_list(task_id: String, core: State<'_, Core>) -> Result<Vec<WorkUpdate>> {
    tasks::work_updates(&core.db, &task_id).await
}

#[tauri::command]
pub async fn work_update_add(
    task_id: String,
    body: String,
    core: State<'_, Core>,
) -> Result<WorkUpdate> {
    tasks::add_work_update(&core.db, &*core.clock, &task_id, &body).await
}

#[tauri::command]
pub async fn work_update_delete(id: String, core: State<'_, Core>) -> Result<()> {
    tasks::delete_work_update(&core.db, &*core.clock, &id).await
}

// ---- daily logs (the Time screen) -----------------------------------------------------------

/// The log for a local day `YYYY-MM-DD`: live for today, frozen for earlier days, `null` if none.
#[tauri::command]
pub async fn daily_log_get(date: String, core: State<'_, Core>) -> Result<Option<DailyLog>> {
    let day = chrono::NaiveDate::parse_from_str(&date, "%Y-%m-%d")
        .map_err(|_| AppError::validation("date", "Dates look like 2026-10-04."))?;
    daily_log::get(&core.db, &*core.clock, day).await
}

// ---- usage: "where my time went" (opt-in, local only) ----------------------------------------

/// Time per app, per site and per local hour inside `[from, to)` (ms since the epoch, UTC).
#[tauri::command]
pub async fn usage_summary(
    from: i64,
    to: i64,
    usage: State<'_, Arc<UsageService>>,
) -> Result<UsageSummary> {
    usage.summary(from, to).await
}

/// The exact active spans of one app (by the `app` name in `usage_summary`), clipped to the range.
#[tauri::command]
pub async fn usage_app_sessions(
    app: String,
    from: i64,
    to: i64,
    usage: State<'_, Arc<UsageService>>,
) -> Result<Vec<TimeRange>> {
    usage.app_sessions(&app, from, to).await
}

/// The exact active spans on one site, clipped to the range.
#[tauri::command]
pub async fn usage_domain_sessions(
    domain: String,
    from: i64,
    to: i64,
    usage: State<'_, Arc<UsageService>>,
) -> Result<Vec<TimeRange>> {
    usage.domain_sessions(&domain, from, to).await
}

#[tauri::command]
pub async fn tracking_status(
    tracking: State<'_, Tracking>,
    settings: State<'_, Arc<SettingsService>>,
) -> Result<TrackingStatus> {
    let all = settings.get_all().await?;
    let enabled = all
        .get(SettingsKey::TrackingApps.as_str())
        .and_then(Value::as_bool)
        .unwrap_or(false);
    Ok(TrackingStatus {
        supported: tracking.supported(),
        running: tracking.is_running(),
        enabled,
    })
}

/// Deletes usage overlapping `[from, to)`; a missing bound is open-ended, so both missing deletes
/// everything. Returns how many sessions were removed.
#[tauri::command]
pub async fn usage_delete(
    from: Option<i64>,
    to: Option<i64>,
    usage: State<'_, Arc<UsageService>>,
) -> Result<u64> {
    match (from, to) {
        (None, None) => usage.delete_all().await,
        (from, to) => {
            usage
                .delete_range(from.unwrap_or(0), to.unwrap_or(i64::MAX))
                .await
        }
    }
}

/// Every site seen, with its category and whether it is tracked.
#[tauri::command]
pub async fn usage_domains(usage: State<'_, Arc<UsageService>>) -> Result<Vec<DomainSetting>> {
    usage.domains().await
}

/// "Do not track" for a site; turning it off also deletes what was recorded for it.
#[tauri::command]
pub async fn domain_set_tracked(
    domain: String,
    tracked: bool,
    usage: State<'_, Arc<UsageService>>,
) -> Result<()> {
    usage.set_domain_tracked(&domain, tracked).await
}

#[tauri::command]
pub async fn domain_set_category(
    domain: String,
    category: String,
    usage: State<'_, Arc<UsageService>>,
) -> Result<()> {
    usage.set_domain_category(&domain, &category).await
}

/// Ingestion point for the browser extensions (PRD 4.7), via the native-messaging bridge.
///
/// `domain` must be a bare host name (never a URL, path or title) and **incognito/private
/// windows are the extension's responsibility: it must never call this for them.** The core
/// cannot tell, so it also refuses everything while `tracking.apps` is off. Returns whether the
/// session was stored (false: too short, or the site is marked "do not track").
#[tauri::command]
pub async fn usage_record_domain(
    browser: String,
    domain: String,
    started_at: i64,
    ended_at: i64,
    usage: State<'_, Arc<UsageService>>,
    settings: State<'_, Arc<SettingsService>>,
) -> Result<bool> {
    let all = settings.get_all().await?;
    let enabled = all
        .get(SettingsKey::TrackingApps.as_str())
        .and_then(Value::as_bool)
        .unwrap_or(false);
    if !enabled {
        return Ok(false);
    }
    usage
        .record_domain_session(&browser, &domain, started_at, ended_at)
        .await
}

// ---- your data: export, import, delete all (F0-11) --------------------------------------------

/// Where an export went.
#[derive(serde::Serialize)]
pub struct Exported {
    pub path: String,
    pub bytes: u64,
}

/// Ask where to save, then write everything there. `None` if the person cancelled the dialog.
/// The path comes only from the system dialog, never from the webview.
#[tauri::command]
pub async fn data_export(app: AppHandle, core: State<'_, Core>) -> Result<Option<Exported>> {
    let version = app.package_info().version.to_string();
    let document = data::export(&core.db, &*core.clock, &version).await?;
    let name = format!("loaf-export-{}.json", core.clock.today());
    let picker = app.clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        picker
            .dialog()
            .file()
            .set_file_name(&name)
            .add_filter("Loaf export", &["json"])
            .blocking_save_file()
    })
    .await
    .map_err(|_| AppError::internal("The save dialog stopped unexpectedly."))?;
    let Some(chosen) = chosen else {
        return Ok(None);
    };
    let path = chosen
        .into_path()
        .map_err(|_| AppError::io("Loaf can't save to that place."))?;
    let bytes = serde_json::to_vec_pretty(&document)
        .map_err(|_| AppError::internal("Loaf couldn't write the export."))?;
    let size = bytes.len() as u64;
    let target = path.clone();
    tauri::async_runtime::spawn_blocking(move || std::fs::write(target, bytes))
        .await
        .map_err(|_| AppError::internal("Saving stopped unexpectedly."))?
        .map_err(|_| AppError::io("Loaf couldn't save the file there."))?;
    let shown = path.to_string_lossy().into_owned();
    core.bus.publish(Event::DataExported {
        at: core.clock.now_ms(),
        path: shown.clone(),
        bytes: size,
    });
    Ok(Some(Exported {
        path: shown,
        bytes: size,
    }))
}

/// Ask for an export file and restore it into an empty Loaf. `None` if the dialog was cancelled.
#[tauri::command]
pub async fn data_import(
    app: AppHandle,
    core: State<'_, Core>,
) -> Result<Option<std::collections::BTreeMap<String, u64>>> {
    const MAX_BYTES: u64 = 1 << 30;
    let picker = app.clone();
    let chosen = tauri::async_runtime::spawn_blocking(move || {
        picker
            .dialog()
            .file()
            .add_filter("Loaf export", &["json"])
            .blocking_pick_file()
    })
    .await
    .map_err(|_| AppError::internal("The open dialog stopped unexpectedly."))?;
    let Some(chosen) = chosen else {
        return Ok(None);
    };
    let path = chosen
        .into_path()
        .map_err(|_| AppError::io("Loaf can't open that file."))?;
    let document = tauri::async_runtime::spawn_blocking(move || {
        let size = std::fs::metadata(&path)?.len();
        if size > MAX_BYTES {
            return Ok(Err(AppError::validation(
                "file",
                "That file is too large to be a Loaf export.",
            )));
        }
        let bytes = std::fs::read(&path)?;
        Ok::<_, std::io::Error>(
            serde_json::from_slice::<serde_json::Value>(&bytes)
                .map_err(|_| AppError::validation("file", "That file isn't a Loaf export.")),
        )
    })
    .await
    .map_err(|_| AppError::internal("Reading stopped unexpectedly."))?
    .map_err(|_| AppError::io("Loaf couldn't read that file."))??;
    data::import(&core.db, &*core.clock, document)
        .await
        .map(Some)
}

/// Erase everything. `confirm` must be exactly `DELETE`.
#[tauri::command]
pub async fn data_delete_all(confirm: String, core: State<'_, Core>) -> Result<()> {
    data::delete_all(&core.db, &*core.clock, &confirm).await
}

// ---- links ----------------------------------------------------------------------------------

/// Opens an `http`, `https` or `mailto` link in the default app. Anything else is refused.
#[tauri::command]
pub async fn open_url(url: String, app: AppHandle) -> Result<()> {
    let url = links::validate_external_url(&url)?;
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|_| AppError::io("Loaf couldn't open that link."))
}
