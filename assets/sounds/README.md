# Sound Assets

Put the local sound files for the toddler app in this folder.

Expected files:

- `bus-horn.mp3`
- `plane-whoosh.mp3`
- `train-horn.mp3`
- `success-chime.mp3`
- `background-music.mp3` (optional)

These files are referenced from `src/utils/soundEffects.ts`.

When you add real sounds later:

1. Place the replacement files in this folder using the same names.
2. Open `src/utils/soundEffects.ts`.
3. Replace each `asset: null` with the matching `require(...)` line.

For optional looping background music:

1. Add `background-music.mp3` here.
2. In `src/utils/soundEffects.ts`, change `BACKGROUND_MUSIC_ASSET` from `null` to:

```ts
require("../../assets/sounds/background-music.mp3")
```

Example:

```ts
asset: require("../../assets/sounds/bus-horn.mp3")
```
