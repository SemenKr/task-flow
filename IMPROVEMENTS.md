# Improvement Plan

## Now

* [ ] Add tests for recent fixes:
  * reorder disabled with active global filters
  * delete success/error flow
  * filtered tasks when totalCount > 100

## Next

* [ ] Reduce Main/DemoMain divergence:
  * [ ] audit remaining duplication in `DemoMain` after `TaskItem` reuse
  * [ ] decide whether `DemoTasks` should converge with production `Tasks`
  * [ ] identify demo-only UI that should stay separate
* [ ] Move UI-only state out of RTK Query cache

## Later

* [ ] Add keyboard/a11y fallback for drag-and-drop
* [ ] TaskItem audit: P2 - move `Intl.DateTimeFormat` locale from hardcoded `'en'` to active i18n locale
* [ ] TaskItem audit: P3 - replace `transition-all` with explicit transition properties + reduced-motion variant
* [ ] TaskItem audit: P3 - hoist status/priority maps to module-level constants
* [ ] TaskItem audit: P3 - profile list re-renders and add `React.memo`/stable callbacks if needed
* [ ] Rename `TaskItem'` folder to a tooling-safe path
* [ ] Review whether bootstrap helpers should be extracted from `App.tsx`

## Done

* [x] Fix checkbox accessibility label
  * Follow-up: align checkbox aria-label wording with future i18n strategy.
* [x] Stabilize lint setup
* [x] Improve user-facing error messages
* [x] Audit real-mode touch interactions
  * Follow-up: consider explicit long-press or keyboard-accessible reorder fallback for touch-first users.
* [x] Add regression check for 320px layout
* [x] Review appSlice async matchers
* [x] Stabilize auth/demo bootstrap in `App.tsx`
* [x] Disable task reorder when global filters are active
* [x] Fix incomplete filtered task results when totalCount > 100
* [x] Fix false-success task deletion feedback
* [x] Prevent task metadata clipping on small screens
* [x] TaskItem audit: P1 - add confirmation step before deleting task (or undo flow)
* [x] TaskItem audit: P1 - keep task action buttons visible on keyboard focus (`group-focus-within`)
* [x] TaskItem audit: P1 - keep drag reorder explicitly mouse-only until keyboard/touch reorder is implemented
* [x] TaskItem audit: P2 - prevent duplicate mutations (disable controls while update/delete/save is pending)
* [x] TaskItem audit: P2 - move `Intl.DateTimeFormat` creation out of render
* [x] TaskItem audit: P2 - replace `div[role="button"]` details toggle with native `<button>`
* [x] Introduce optional `TaskItem` callbacks (`onUpdateTask`/`onDeleteTask`) with RTK Query fallback
* [x] Replace `DemoTaskItem` with shared `TaskItem` in `DemoMain` (local callbacks + localStorage flow preserved)
