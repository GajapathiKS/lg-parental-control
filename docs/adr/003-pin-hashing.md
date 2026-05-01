# ADR-003: PIN Stored as SHA-256 Hash

- **Status:** Accepted
- **Date:** 2026-04-12
- **Context:** How to secure the parent PIN on a device with no server-side auth?
- **Decision:** Hash the PIN with SHA-256 + random salt. Store hash and salt in localStorage. Use Web Crypto API (available in webOS browser engine).
- **Alternatives Considered:**
  - Plain text PIN — simple but a tech-savvy kid could read localStorage in dev tools
  - bcrypt — not available in browser without a library, overkill for a 4-6 digit PIN
  - No PIN, just a hidden settings menu — too easy to find
- **Consequences:** PIN can't be recovered (only reset). If someone accesses TV's developer tools, they could clear localStorage (resetting the app). Acceptable risk for personal use.
