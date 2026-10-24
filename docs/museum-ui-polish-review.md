# Museum Admin UI polish — 24 October 2026

## Review and changes

This is a shared-control polish pass, not a redesign of the approved room maps or curator workflows. Reviewed the museum shell/navigation, search and filters, proposal and family editors, review forms, move companion, modal and tree controls, and planning counts.

- Raised museum action and icon controls from 38px to the shared 44px target; navigation and disclosure rows share it. Multiline labels can grow.
- Made disabled museum actions visibly disabled outside the planner as well.
- Standardized neutral, visible keyboard focus within museum shells and dialogs, including controls whose earlier styles removed the outline.
- Scoped a shared form class to museum mutations. Sentence-case confirmation text, compact aligned checkboxes, comfortable label spacing and 16px text controls replace inherited uppercase metadata treatment.
- Kept changing statistics aligned with tabular numerals.
- Allowed action rows, long saint names and destination labels to wrap without page overflow.
- Stacked move-companion search and sort on narrow screens; added safe-area padding and contained dialog overscroll.
- Retained typography hierarchy, approved map colors, regional/lineage semantics, all copy, data and workflow behavior. No new animation.

## Verification

- Development check passed; no schema, server-action, route or auth changes.
- Production-component fixtures with mocked actions checked at desktop (1280px), 390px and 320px; no page overflow in those fixtures.
- Measured action/navigation/icon targets at 44px, text controls at 16px, disabled opacity at 0.5 and confirmation text in sentence case.
- Native saint dialog opened and closed with Escape, returned focus to its trigger, and fitted the phone viewport.
- Fixture checks are not a full authenticated production audit or physical-device Safari test. Map geometry and tree canvas behavior are unchanged.

The shared form class is the only component change. Most fixes live in tokens and shared CSS so SPN and Vrindavan receive the same treatment. The release captain owns the integrated production build.
