# ADR-002: Vanilla JS Over Enact Framework

- **Status:** Accepted
- **Date:** 2026-04-12
- **Context:** LG provides Enact (React-based) as their official UI framework. Should we use it?
- **Decision:** Vanilla HTML/CSS/JS with no build step.
- **Alternatives Considered:**
  - Enact framework — official, component library, but requires Node.js build pipeline, adds ~2MB, learning curve
  - Preact/lightweight React — smaller than Enact but still needs bundling
- **Consequences:** No component library, no state management framework. If the app grows beyond 15-20 screens, consider migrating to Enact. For MVP with ~10 screens, vanilla JS is faster to develop, easier to debug, and deploys as-is.
