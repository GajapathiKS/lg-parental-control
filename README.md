# 🛡️ LG webOS Parental Control

A free, open-source parental control app for LG Smart TVs (webOS). Monitor and limit your kids' screen time directly on the TV — no server, no cloud, no subscription.

## What It Does

- **Set daily screen time limits** per child profile
- **Track usage** with a visual dashboard and weekly chart
- **Lock the TV** when time runs out (parent PIN to unlock)
- **Extend time** with parent override
- **Multiple child profiles** with separate limits
- **100% on-device** — no data leaves your TV

## Quick Start

### Prerequisites

1. **LG Developer Account** — Sign up free at [webostv.developer.lge.com](https://webostv.developer.lge.com)
2. **webOS CLI** — Install the webOS SDK: `npm install -g @aspect/webos-cli`  
   Or download from [SDK Introduction](https://webostv.developer.lge.com/develop/tools/sdk-introduction)
3. **Developer Mode on your TV** — Install "Developer Mode" app from LG Content Store, log in with your dev account

### Setup Your TV for Sideloading

```bash
# 1. Enable Developer Mode on TV
#    Open Developer Mode app on TV → toggle ON → note the IP address

# 2. Add your TV to CLI
ares-setup-device

# Follow prompts:
#   name: myTV
#   ip: [your TV's IP]
#   port: 9922
#   username: prisoner
#   passphrase: [from Developer Mode app]
```

### Build & Deploy

```bash
# Package the app
ares-package lg-parental-control/

# Install on your TV
ares-install --device myTV com.parental.control_1.0.0_all.ipk

# Launch it
ares-launch --device myTV com.parental.control
```

### Test in Browser (no TV needed)

Just open `index.html` in Chrome or Firefox. The app includes a webOS stub that mocks TV APIs so you can test the full UI flow in any browser.

```bash
# Run tests
# Open tests/runner.html in your browser
# Or use a local server:
npx serve lg-parental-control/
# Then visit http://localhost:3000/tests/runner.html
```

## Project Structure

```
lg-parental-control/
├── appinfo.json           # webOS app manifest
├── index.html             # Main entry point
├── css/
│   ├── tv-reset.css       # TV-specific CSS (10-foot UI, focus states)
│   ├── main.css           # Layout, themes, cards, modals
│   └── components.css     # Buttons, numpad, profiles, charts
├── js/
│   ├── app.js             # Main app + router
│   ├── storage.js         # localStorage wrapper
│   ├── pin.js             # SHA-256 PIN hashing
│   ├── timer.js           # Screen time tracking + limits
│   ├── navigation.js      # D-pad focus management
│   └── ui/
│       ├── components.js  # Reusable UI elements
│       ├── screens.js     # All app screens
│       └── lockscreen.js  # Time's up + warning overlays
├── service/
│   ├── package.json       # Background service manifest
│   └── timer-service.js   # Background timer (runs when app isn't visible)
├── webOSTVjs/
│   └── webOSTV.js         # webOS library (stub for browser testing)
├── tests/
│   ├── runner.html        # Open in browser to run all tests
│   ├── storage.test.js    # Storage module tests
│   ├── timer.test.js      # Timer module tests
│   └── pin.test.js        # PIN module tests
└── docs/adr/              # Architecture Decision Records
```

## Test Credentials (Seed Data)

To load test data, open browser console and run:
```js
Storage.loadSeedData();
location.reload();
```

- **PIN:** 1234
- **Profiles:** Riya (120 min/day), Arjun (90 min/day)
- **Usage:** 3 days of test data pre-loaded

## Architecture Decisions

See `docs/adr/` for why things are built the way they are:
- ADR-001: No server (fully on-device)
- ADR-002: Vanilla JS over Enact framework
- ADR-003: PIN stored as SHA-256 hash
- ADR-004: Background JS service for time tracking

## Remote Control Navigation

The entire app is navigable with your TV remote:
- **Arrow keys** — move between buttons/cards
- **OK/Enter** — select
- **Back** — go to previous screen
- **Number pad** — available on PIN entry screens

## License

MIT — free for personal and commercial use.
