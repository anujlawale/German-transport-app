# Sound Assets

Put the local sound files for the toddler app in this folder.

Expected files:

- `bus-horn.mp3`
- `plane-whoosh.mp3`
- `train-horn.mp3`
- `success-chime.mp3`

These files are referenced from `src/utils/soundEffects.ts`.

When you add the real files:

1. Place them in this folder using the exact names above.
2. Open `src/utils/soundEffects.ts`.
3. Replace each placeholder `asset: null` with the matching `require(...)` line that is already shown in comments.

Example:

```ts
asset: require("../../assets/sounds/bus-horn.mp3")
```
