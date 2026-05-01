# Product Roadmap

## Current Assessment

The app is a solid browser-testable webOS prototype: it has local profiles, local usage logs, PIN protection, remote-friendly navigation, and a simple service scaffold. The biggest maintenance needs are stronger enforcement wiring, safer data handling, and clearer parent workflows.

## Next Features

1. Time rules
   - Add per-profile schedules such as school nights, weekends, and sleep hours.
   - Model rules as allow or block windows with days of week, start time, end time, and priority.
   - Enforce both daily minutes and schedule windows in the same timer status result.

2. One-time TV passwords
   - Keep a parent PIN for normal use.
   - Generate 30 single-use numeric codes for emergency unlocks.
   - Store only salted hashes on the TV and consume a code immediately after successful use.

3. Scientific space UI
   - Use a mission-control visual language: restrained star field, grid overlays, orbital progress, and crisp telemetry panels.
   - Keep contrast high and focus states obvious for TV distance.
   - Avoid decorative noise where the parent needs fast scanning.

4. webOS enforcement
   - Connect the UI timer to the JS service through Luna calls.
   - Verify whether sideloaded service permissions can block or relaunch foreground TV activity.
   - Document TV-model-specific limitations.

## Proposed Rule Data Shape

```js
{
  id: 'rule_...',
  profileId: 'profile_1',
  name: 'School night wind-down',
  mode: 'block',
  days: [1, 2, 3, 4],
  startTime: '20:30',
  endTime: '06:30',
  enabled: true
}
```

Rules that cross midnight should be treated as active when the current time is after `startTime` or before `endTime`.
