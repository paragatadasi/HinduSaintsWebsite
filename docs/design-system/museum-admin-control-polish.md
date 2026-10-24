# Museum Admin control polish

[Design system index](../design-system.md)

### Museum Admin control polish

Museum controls use `--size-museum-control` (the shared 44px control target),
including primary/secondary actions, icon buttons, navigation rows and review
summaries. Allow multiline action labels to wrap and grow; do not impose a fixed
button height. Disabled actions use the shared disabled opacity and a disabled
cursor across all museum screens, not just the planner.

Use `museum-action-form` for museum mutation forms. Keep field labels in sentence
case and confirmation text at the review field scale; avoid inheriting uppercase
metadata styling into acknowledgements. Checkbox labels form a full touch row,
while the checkbox itself remains compact. Text inputs and selects use the 1rem
museum input token. Required controls and validation behavior remain unchanged.

Within the museum shell and dialogs, keyboard focus has a neutral token-based
outline. Statistics use tabular numerals. Scope wrapping rules to action rows and
identity/destination text so long names cannot widen the page. On phones, move
search and sort stack; dialogs retain safe-area padding and native focus/Escape
behavior. Keep the approved map palette and semantic regional/lineage colors.
