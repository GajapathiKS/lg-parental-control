# ADR-004: Background JS Service for Time Tracking

- **Status:** Accepted
- **Date:** 2026-04-12
- **Context:** How to track screen time when the parental control app isn't in the foreground? A web app alone can't run in background on webOS.
- **Decision:** Use a webOS JS Service (runs as a separate Node.js process on the TV) that polls system time every 60 seconds and tracks accumulated usage.
- **Alternatives Considered:**
  - Timer in main app only — stops tracking when app is in background
  - Luna Activity Manager scheduled callbacks — more complex, limited API access on sideloaded apps
  - System-level integration — requires root/privileged access, not available for sideloaded apps
- **Consequences:** JS Services on sideloaded apps have limited Luna API access (public APIs only). Some system-level monitoring (which app is open) may not be available without elevated permissions. The timer tracks elapsed wall-clock time, not per-app usage.
