//! The private diary (FR-86). Entries are encrypted at rest with XChaCha20-Poly1305; the key is
//! derived from the password with Argon2id and held in memory only while the diary is unlocked.
//! A forgotten password cannot be recovered: the only way back in is to erase the diary.
//!
//! Each entry is bound to its day (the day is the associated data), so one day's ciphertext cannot
//! be moved onto another. The database holds ciphertext, nonce and salt as hex text.

use std::sync::Mutex;

use argon2::{Algorithm, Argon2, Params, Version};
use chacha20poly1305::aead::rand_core::RngCore;
use chacha20poly1305::aead::{Aead, KeyInit, OsRng, Payload};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use chrono::NaiveDate;
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use zeroize::Zeroizing;

use crate::clock::Clock;
use crate::db::Database;
use crate::error::{AppError, Result};

pub const PASSWORD_MIN: usize = 6;
pub const TEXT_MAX: usize = 200_000;
const CHECK_PHRASE: &[u8] = b"loaf-diary-v1";
const CHECK_AAD: &[u8] = b"check";

type Key = Zeroizing<[u8; 32]>;

/// The diary's in-memory key. `None` = locked.
#[derive(Default)]
pub struct Diary {
    key: Mutex<Option<Key>>,
}

impl Diary {
    fn set(&self, key: Option<Key>) {
        *self.key.lock().unwrap_or_else(|p| p.into_inner()) = key;
    }
    fn get(&self) -> Option<Key> {
        self.key
            .lock()
            .unwrap_or_else(|p| p.into_inner())
            .as_ref()
            .map(|k| Zeroizing::new(**k))
    }
    pub fn is_unlocked(&self) -> bool {
        self.key.lock().unwrap_or_else(|p| p.into_inner()).is_some()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "ts", derive(ts_rs::TS), ts(export))]
pub struct DiaryStatus {
    /// A password has been set.
    pub configured: bool,
    pub unlocked: bool,
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn unhex(s: &str) -> Result<Vec<u8>> {
    if !s.len().is_multiple_of(2) {
        return Err(AppError::internal("The diary data is damaged."));
    }
    (0..s.len())
        .step_by(2)
        .map(|i| {
            s.get(i..i + 2)
                .and_then(|h| u8::from_str_radix(h, 16).ok())
                .ok_or_else(|| AppError::internal("The diary data is damaged."))
        })
        .collect()
}

#[cfg(not(test))]
fn kdf_params() -> Params {
    // 19 MiB, 2 passes: the OWASP minimum for Argon2id.
    Params::new(19 * 1024, 2, 1, Some(32)).expect("valid argon2 params")
}
#[cfg(test)]
fn kdf_params() -> Params {
    Params::new(8, 1, 1, Some(32)).expect("valid argon2 params")
}

async fn derive(password: &str, salt: Vec<u8>) -> Result<Key> {
    let password = Zeroizing::new(password.as_bytes().to_vec());
    tokio::task::spawn_blocking(move || {
        let mut key = Zeroizing::new([0u8; 32]);
        Argon2::new(Algorithm::Argon2id, Version::V0x13, kdf_params())
            .hash_password_into(&password, &salt, &mut *key)
            .map_err(|_| AppError::internal("Loaf could not prepare the diary key."))?;
        Ok(key)
    })
    .await
    .map_err(|_| AppError::internal("Loaf could not prepare the diary key."))?
}

fn seal(key: &Key, aad: &[u8], plain: &[u8]) -> Result<(String, String)> {
    let cipher = XChaCha20Poly1305::new((&**key).into());
    let mut nonce = [0u8; 24];
    OsRng.fill_bytes(&mut nonce);
    let data = cipher
        .encrypt(XNonce::from_slice(&nonce), Payload { msg: plain, aad })
        .map_err(|_| AppError::internal("Loaf could not lock the diary entry."))?;
    Ok((hex(&nonce), hex(&data)))
}

fn open(key: &Key, aad: &[u8], nonce: &str, data: &str) -> Result<Vec<u8>> {
    let nonce = unhex(nonce)?;
    if nonce.len() != 24 {
        return Err(AppError::internal("The diary data is damaged."));
    }
    XChaCha20Poly1305::new((&**key).into())
        .decrypt(
            XNonce::from_slice(&nonce),
            Payload {
                msg: &unhex(data)?,
                aad,
            },
        )
        .map_err(|_| AppError::internal("The diary data is damaged."))
}

fn need_key(diary: &Diary) -> Result<Key> {
    diary
        .get()
        .ok_or_else(|| AppError::invalid_transition("The diary is locked."))
}

fn check_day(day: &str) -> Result<()> {
    NaiveDate::parse_from_str(day, "%Y-%m-%d")
        .map(|_| ())
        .map_err(|_| AppError::validation("day", "Pick a day."))
}

pub async fn status(db: &Database, diary: &Diary) -> Result<DiaryStatus> {
    let configured = db
        .read(|conn| {
            Ok(conn
                .query_row("SELECT 1 FROM diary_meta WHERE id = 1", [], |_| Ok(()))
                .optional()?
                .is_some())
        })
        .await?;
    Ok(DiaryStatus {
        configured,
        unlocked: configured && diary.is_unlocked(),
    })
}

/// Set the first password. The diary is unlocked afterwards.
pub async fn setup(db: &Database, diary: &Diary, clock: &dyn Clock, password: &str) -> Result<()> {
    if password.chars().count() < PASSWORD_MIN {
        return Err(AppError::validation(
            "password",
            format!("Use at least {PASSWORD_MIN} characters."),
        ));
    }
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    let key = derive(password, salt.to_vec()).await?;
    let (nonce, data) = seal(&key, CHECK_AAD, CHECK_PHRASE)?;
    let (salt, now) = (hex(&salt), clock.now_ms());
    db.write(move |tx| {
        let made = tx.execute(
            "INSERT OR IGNORE INTO diary_meta (id, salt, check_nonce, check_data, created_at) VALUES (1, ?1, ?2, ?3, ?4)",
            params![salt, nonce, data, now],
        )?;
        if made == 0 {
            return Err(AppError::conflict("The diary already has a password."));
        }
        Ok(((), vec![]))
    })
    .await?;
    diary.set(Some(key));
    Ok(())
}

pub async fn unlock(db: &Database, diary: &Diary, password: &str) -> Result<()> {
    let meta = db
        .read(|conn| {
            Ok(conn
                .query_row(
                    "SELECT salt, check_nonce, check_data FROM diary_meta WHERE id = 1",
                    [],
                    |r| {
                        Ok((
                            r.get::<_, String>(0)?,
                            r.get::<_, String>(1)?,
                            r.get::<_, String>(2)?,
                        ))
                    },
                )
                .optional()?)
        })
        .await?
        .ok_or_else(|| AppError::not_found("The diary has no password yet."))?;
    let key = derive(password, unhex(&meta.0)?).await?;
    match open(&key, CHECK_AAD, &meta.1, &meta.2) {
        Ok(p) if p == CHECK_PHRASE => {
            diary.set(Some(key));
            Ok(())
        }
        _ => Err(AppError::validation(
            "password",
            "That is not the right password.",
        )),
    }
}

/// Forget the key. Nothing readable stays in memory from here on.
pub fn lock(diary: &Diary) {
    diary.set(None);
}

/// Days that have an entry, newest first. Needs the diary unlocked, so the list is private too.
pub async fn days(db: &Database, diary: &Diary) -> Result<Vec<String>> {
    need_key(diary)?;
    db.read(|conn| {
        let mut stmt = conn.prepare("SELECT day FROM diary_entries ORDER BY day DESC")?;
        let rows = stmt
            .query_map([], |r| r.get(0))?
            .collect::<rusqlite::Result<Vec<String>>>()?;
        Ok(rows)
    })
    .await
}

pub async fn day_get(db: &Database, diary: &Diary, day: &str) -> Result<String> {
    let key = need_key(diary)?;
    check_day(day)?;
    let day = day.to_owned();
    let row = db
        .read({
            let day = day.clone();
            move |conn| {
                Ok(conn
                    .query_row(
                        "SELECT nonce, data FROM diary_entries WHERE day = ?1",
                        [&day],
                        |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)),
                    )
                    .optional()?)
            }
        })
        .await?;
    match row {
        None => Ok(String::new()),
        Some((nonce, data)) => String::from_utf8(open(&key, day.as_bytes(), &nonce, &data)?)
            .map_err(|_| AppError::internal("The diary data is damaged.")),
    }
}

/// Save a day's text. Empty text removes the entry.
pub async fn day_save(
    db: &Database,
    diary: &Diary,
    clock: &dyn Clock,
    day: &str,
    text: &str,
) -> Result<()> {
    let key = need_key(diary)?;
    check_day(day)?;
    if text.len() > TEXT_MAX {
        return Err(AppError::validation("text", "That entry is too long."));
    }
    let (day, now) = (day.to_owned(), clock.now_ms());
    if text.trim().is_empty() {
        return db
            .write(move |tx| {
                tx.execute("DELETE FROM diary_entries WHERE day = ?1", [&day])?;
                Ok(((), vec![]))
            })
            .await;
    }
    let (nonce, data) = seal(&key, day.as_bytes(), text.as_bytes())?;
    db.write(move |tx| {
        tx.execute(
            "INSERT INTO diary_entries (day, nonce, data, updated_at) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(day) DO UPDATE SET nonce = excluded.nonce, data = excluded.data, updated_at = excluded.updated_at",
            params![day, nonce, data, now],
        )?;
        Ok(((), vec![]))
    })
    .await
}

/// Forgotten password: erase the diary (every entry and the password) so a new one can be set.
pub async fn erase(db: &Database, diary: &Diary) -> Result<()> {
    diary.set(None);
    db.write(|tx| {
        tx.execute("DELETE FROM diary_entries", [])?;
        tx.execute("DELETE FROM diary_meta", [])?;
        Ok(((), vec![]))
    })
    .await
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use chrono_tz::Tz;

    use super::*;
    use crate::bus::EventBus;
    use crate::clock::FakeClock;
    use crate::error::ErrorCode;

    fn setup_db() -> (tempfile::TempDir, Arc<Database>, FakeClock, Diary) {
        let dir = tempfile::tempdir().unwrap();
        let db =
            Arc::new(Database::open(&dir.path().join("loaf.db"), EventBus::default()).unwrap());
        (
            dir,
            db,
            FakeClock::new(1_793_188_800_000, Tz::UTC),
            Diary::default(),
        )
    }

    #[test]
    fn hex_round_trips_and_rejects_junk() {
        assert_eq!(unhex(&hex(&[0, 1, 254, 255])).unwrap(), [0, 1, 254, 255]);
        assert!(unhex("abc").is_err());
        assert!(unhex("zz").is_err());
    }

    #[tokio::test]
    async fn a_new_diary_needs_a_password_and_opens_only_with_it() {
        let (_d, db, clock, diary) = setup_db();
        assert_eq!(
            status(&db, &diary).await.unwrap(),
            DiaryStatus {
                configured: false,
                unlocked: false
            }
        );
        assert_eq!(
            setup(&db, &diary, &clock, "abc").await.unwrap_err().code,
            ErrorCode::Validation
        );
        setup(&db, &diary, &clock, "correct horse").await.unwrap();
        assert_eq!(
            status(&db, &diary).await.unwrap(),
            DiaryStatus {
                configured: true,
                unlocked: true
            }
        );
        assert_eq!(
            setup(&db, &diary, &clock, "another one")
                .await
                .unwrap_err()
                .code,
            ErrorCode::Conflict
        );

        lock(&diary);
        assert!(!status(&db, &diary).await.unwrap().unlocked);
        assert_eq!(
            unlock(&db, &diary, "wrong password")
                .await
                .unwrap_err()
                .code,
            ErrorCode::Validation
        );
        assert!(!diary.is_unlocked());
        unlock(&db, &diary, "correct horse").await.unwrap();
        assert!(diary.is_unlocked());
    }

    #[tokio::test]
    async fn entries_round_trip_and_the_database_never_holds_the_text() {
        let (dir, db, clock, diary) = setup_db();
        setup(&db, &diary, &clock, "correct horse").await.unwrap();
        let secret = "I need to submit the lab report by Friday ✓";
        day_save(&db, &diary, &clock, "2026-10-28", secret)
            .await
            .unwrap();
        day_save(&db, &diary, &clock, "2026-10-27", "second day")
            .await
            .unwrap();
        assert_eq!(day_get(&db, &diary, "2026-10-28").await.unwrap(), secret);
        assert_eq!(day_get(&db, &diary, "2026-10-01").await.unwrap(), "");
        assert_eq!(
            days(&db, &diary).await.unwrap(),
            ["2026-10-28", "2026-10-27"]
        );

        // The same text twice gives different ciphertext (fresh nonce each save).
        let read = |day: &str| {
            let conn = rusqlite::Connection::open(dir.path().join("loaf.db")).unwrap();
            conn.query_row(
                "SELECT data FROM diary_entries WHERE day = ?1",
                [day],
                |r| r.get::<_, String>(0),
            )
            .unwrap()
        };
        let first = read("2026-10-28");
        day_save(&db, &diary, &clock, "2026-10-28", secret)
            .await
            .unwrap();
        assert_ne!(first, read("2026-10-28"));

        // No part of the plaintext, in the database or its write-ahead log, is readable.
        let mut bytes = Vec::new();
        for entry in std::fs::read_dir(dir.path()).unwrap().flatten() {
            if entry.file_name().to_string_lossy().starts_with("loaf.db") {
                bytes.extend(std::fs::read(entry.path()).unwrap());
            }
        }
        let hay = String::from_utf8_lossy(&bytes);
        assert!(!hay.contains("lab report") && !hay.contains("second day"));
    }

    #[tokio::test]
    async fn a_locked_diary_reads_and_writes_nothing() {
        let (_d, db, clock, diary) = setup_db();
        setup(&db, &diary, &clock, "correct horse").await.unwrap();
        day_save(&db, &diary, &clock, "2026-10-28", "hello")
            .await
            .unwrap();
        lock(&diary);
        for err in [
            day_get(&db, &diary, "2026-10-28").await.unwrap_err(),
            day_save(&db, &diary, &clock, "2026-10-28", "x")
                .await
                .unwrap_err(),
            days(&db, &diary).await.unwrap_err(),
        ] {
            assert_eq!(err.code, ErrorCode::InvalidTransition);
        }
    }

    #[tokio::test]
    async fn an_entry_moved_to_another_day_cannot_be_opened_and_empty_text_removes_it() {
        let (dir, db, clock, diary) = setup_db();
        setup(&db, &diary, &clock, "correct horse").await.unwrap();
        day_save(&db, &diary, &clock, "2026-10-28", "hello")
            .await
            .unwrap();
        rusqlite::Connection::open(dir.path().join("loaf.db"))
            .unwrap()
            .execute("UPDATE diary_entries SET day = '2026-10-29'", [])
            .unwrap();
        assert_eq!(
            day_get(&db, &diary, "2026-10-29").await.unwrap_err().code,
            ErrorCode::Internal
        );
        day_save(&db, &diary, &clock, "2026-10-29", "  ")
            .await
            .unwrap();
        assert!(days(&db, &diary).await.unwrap().is_empty());
        assert!(day_save(&db, &diary, &clock, "tomorrow", "x")
            .await
            .is_err());
    }

    #[tokio::test]
    async fn erasing_lets_a_new_password_be_set_and_old_entries_are_gone() {
        let (_d, db, clock, diary) = setup_db();
        setup(&db, &diary, &clock, "old password").await.unwrap();
        day_save(&db, &diary, &clock, "2026-10-28", "hello")
            .await
            .unwrap();
        erase(&db, &diary).await.unwrap();
        assert_eq!(
            status(&db, &diary).await.unwrap(),
            DiaryStatus {
                configured: false,
                unlocked: false
            }
        );
        setup(&db, &diary, &clock, "new password").await.unwrap();
        assert!(days(&db, &diary).await.unwrap().is_empty());
    }
}
