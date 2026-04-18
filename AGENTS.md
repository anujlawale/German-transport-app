# AGENTS.md

## Product Intent

- This repository is a toddler-focused picture-book learning app.
- The experience should feel like choosing and opening books, not operating filters, dashboards, or study tools.
- Child-facing UI must stay simple, visual, playful, uncluttered, and easy to tap on a phone or tablet.
- Category selection should feel like choosing a book cover, not tapping a row of small chips or filter controls.
- Prefer immediate interaction, delight, animation, and short spoken cues over dense text or explanation-heavy UI.
- Large touch targets, obvious feedback, and fast cause-and-effect are core product requirements.

## Current Product Direction

- This app is no longer transport-only.
- It is evolving into a multi-category toddler picture-book system.
- Current and near-future books may include transport, professions, animals, fruits, home objects, and similar toddler-friendly categories.
- The architecture should support many books without requiring a major UI redesign each time.
- New books should generally be addable through data/config plus small reusable helpers, not by rewriting the main screen.

## Data Model Boundaries

Keep these concepts separate:

- `bookId` / `PictureBookId`: what the child is learning
- motion style: how an item moves or feels
- wow kind: what special hero moment or magical effect it gets
- prompt config: how prompts are phrased

Guidance:

- Do not use transport-origin concepts as the main category architecture for non-transport books.
- Motion/environment ideas may exist only as optional movement or prompt metadata when they are useful.
- The code uses `ItemMotionStyle` for movement/feel metadata, because the intent is motion/behavior, not category grouping.
- Avoid mixing “what this item is” with “how this item moves” in one field.

## UI Constraints

- Do not clutter the child-facing UI with many small category chips, dense grids, dropdowns, or filter-like controls.
- Prefer one current book cover with arrows, a simple carousel-like chooser, or similarly clear book-selection patterns.
- Keep large touch targets and strong visual hierarchy.
- Avoid modal-heavy flows unless there is a clear product benefit.
- Do not overload the top area with decorative elements that crowd the scene or hide tappable items on mobile.
- Preserve toddler-friendly simplicity even as categories grow.
- If a new feature adds complexity, prefer hiding it behind parent settings or simplifying it rather than exposing more controls to the child.

## Architecture Guidance

- Keep `App.tsx` thin.
- Do not add more hard-coded book-specific or item-specific branching to `App.tsx` when data/config or a small reusable helper/component can handle the behavior.
- Move reusable wow rendering, scene accent rendering, prompt resolution, and similar logic into focused helpers/components when they start to grow.
- Prefer data-driven configuration for:
  - prompt phrasing
  - book/category accents
  - wow behavior
  - item motion behavior
  - item-specific overrides
- Future books should be addable mostly by data/config, not by expanding large branch-heavy screen components.

## Naming And Cleanup Guidance

- Continue moving from transport-only naming toward generic item/book naming.
- Prefer neutral names like `item`, `card`, `book`, `picture book`, and `prompt config` over `vehicle`-specific names when the code is generic.
- Rename old transport-specific helpers, files, types, and wrappers when doing related work, but avoid giant unrelated refactors.
- Temporary compatibility wrappers are acceptable during migration, but they should be removed once imports have moved to generic names.
- Keep `ItemMotionStyle` focused on movement/feel metadata, not content category.
- Keep naming aligned with the architectural meaning of each field. Do not let old terminology reintroduce old assumptions.

## Content Rules

- Use toddler-friendly German labels and short spoken phrases.
- Prefer common child-recognizable German words over overly formal or technical terms.
- Avoid duplicate content entries.
- If an equivalent item already exists, update or merge it rather than adding a near-duplicate.
- Preserve useful existing additional items unless they are true duplicates.
- When detailed artwork is not available, represent requested visual identity through card color, naming, emoji, and configuration as cleanly as possible.
- Keep spoken phrasing short, warm, and natural for a 2- to 4-year-old audience.

## Prompt Guidance

- Prompt wording should be data-driven where practical.
- Book-level phrasing belongs in book config.
- Motion-style phrasing belongs in shared prompt config only when it is truly generic.
- Item-specific phrasing belongs on the item when it needs a special override.
- Do not add new `if/else` chains for prompt wording in the main screen when config can express the behavior.

## Wow / Magic Behavior Guidance

- The app should support short “wow moments” or hero moments for books and items.
- Wow behavior should be data-driven where practical.
- Different books or items may define different wow kinds.
- Avoid hard-coding each new wow kind directly in the main screen.
- Reusable wow renderers, helpers, or components are preferred over repeated branching.
- Keep wow moments short, obvious, playful, and toddler-friendly.
- A wow moment should feel magical, but it should not remove or replace the core simple play loop.

## Anti-Patterns To Avoid

- Reintroducing old transport-only page composition constraints
- Using transport-origin concepts as the main architecture for every book
- Stuffing all future content into one old transport-oriented file without generalizing the structure
- Growing `App.tsx` with more and more book-specific or item-specific branches
- Adding cluttered child-facing category filters, dense control bars, or dashboard-like UI
- Using overly formal, adult-centric, or explanation-heavy wording for toddler content
- Duplicating near-identical items instead of merging or improving an existing equivalent
- Treating motion style as the same thing as content category
- Adding category-specific UX by branching in the main screen when data/config can express it

## Working Style For Future Agents

- Make changes incrementally.
- Prefer small, safe architectural steps over big rewrites.
- Preserve child-facing simplicity at all times.
- When adding a new book/category, first check whether the change belongs in:
  - data/config
  - a reusable helper/component
  - prompt config
  - wow config
  - item-level overrides
- Only change the main screen when the behavior truly belongs there.
- When summarizing work, clearly separate:
  - visible user-facing changes
  - internal cleanup
  - remaining follow-up work

## Transition Note

- This repository is currently in a transition from a transport-only architecture to a generalized picture-book architecture.
- Expect some temporary compatibility layers or partially generalized structures.
- Improve those incrementally when touching related code, but do not re-entrench old transport-only assumptions while doing so.
- Favor steady cleanup in the direction of generic item/book architecture rather than large unrelated rewrites.
