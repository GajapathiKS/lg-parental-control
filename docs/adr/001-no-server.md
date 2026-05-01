# ADR-001: Fully On-Device, No Server

- **Status:** Accepted
- **Date:** 2026-04-12
- **Context:** Should this app have a cloud backend for remote management, multi-TV sync, or data backup?
- **Decision:** No server. Everything runs on the TV. Settings stored in localStorage.
- **Alternatives Considered:**
  - Firebase backend (free tier) — adds complexity, requires auth, network dependency
  - Companion phone app + API — doubles scope, needs server hosting
- **Consequences:** No remote management from phone. No multi-TV sync. No cloud backup. All acceptable tradeoffs for a personal-use MVP with $0 budget and 1-3 day timeline. Can add a server layer later if needed.
