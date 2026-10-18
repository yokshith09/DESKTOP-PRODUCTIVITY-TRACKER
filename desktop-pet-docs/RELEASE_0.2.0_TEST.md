# Loaf 0.2.0 — owner test checklist

Unsigned test build. Nothing below has been run on a real Windows PC or Mac by the developer. Mark each line pass / fail and report failures.

## Windows
- [ ] App starts; pet appears; drag the pet by pressing on the bear.
- [ ] Settings › Tracking: turn on app tracking; switch between apps for 2 min; Today shows them.
- [ ] Turn on website tracking; visit sites in Chrome and Edge; Websites list shows domains only, no paths.
- [ ] Private/incognito window: nothing recorded.
- [ ] Firefox: note whether anything is recorded (untested).
- [ ] Time › Sites › Open tabs lists tabs; closing one works; nothing persists after restart.
- [ ] Tracking off: nothing new recorded.

## macOS
- [ ] Allow the Automation permission prompt; Chrome/Edge/Brave/Vivaldi sites and tabs appear.
- [ ] Safari, Firefox, Arc record nothing (expected).
- [ ] Foreground app time records.

## Known gaps
Not signed (SmartScreen / Gatekeeper warnings expected). No privacy-radar report yet (M11). Assistant notifications not built.
