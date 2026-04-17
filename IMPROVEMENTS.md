# Improvement Plan

## Now

* [ ] Audit real-mode touch interactions
* [ ] Improve user-facing error messages
* [ ] Add regression check for 320px layout

## Next

* [ ] Reduce Main/DemoMain divergence
* [ ] Move UI-only state out of RTK Query cache
* [ ] Add tests for recent fixes:

  * reorder disabled with active global filters
  * delete success/error flow
  * filtered tasks when totalCount > 100

## Later

* [ ] Add keyboard/a11y fallback for drag-and-drop
* [ ] Rename `TaskItem'` folder to a tooling-safe path
* [ ] Review whether bootstrap helpers should be extracted from `App.tsx`

## Done

* [x] Fix checkbox accessibility label

  * Follow-up: align checkbox aria-label wording with future i18n strategy.
* [x] Stabilize lint setup
* [x] Review appSlice async matchers
* [x] Stabilize auth/demo bootstrap in `App.tsx`
* [x] Disable task reorder when global filters are active
* [x] Fix incomplete filtered task results when totalCount > 100
* [x] Fix false-success task deletion feedback
* [x] Prevent task metadata clipping on small screens
