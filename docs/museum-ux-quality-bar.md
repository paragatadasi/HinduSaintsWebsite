# Museum UX quality bar and curator questionnaire review

Requested by Paragata Dasi, 24 October 2026.

## Standing delivery standard

Every new museum experience must include considered interaction design, visual hierarchy and user-facing copy in its first release candidate. Functional completeness alone is not release readiness. A small first release should reduce scope, not defer basic usability and polish.

Before implementation, identify the curator's immediate task, the minimum evidence needed, the primary action and the outcome after saving. Start from shared design-system components and tokens. Prototype genuinely uncertain directions; do not add a comparison picker for settled decisions.

Before handoff, review the rendered experience with realistic long names, duplicate names, missing photos and content, loading, success, empty, stale and error states. Check desktop and narrow-screen composition, keyboard focus and touch targets. Review copy in context. Distinguish technical test results from visual/usability review and from actual curator validation.

Treat design findings as part of the feature's acceptance work. Record the selected direction, remaining limitations and verified states in its handoff. Use emil-design-foundations during composition, ux-writing-content-design for the conversation and action consequences, and emil-ui-review for the final independent pass; load specialized skills when the task requires them.

## Questionnaire review

Verdict: Approve with changes. Review based on the supplied deployed screenshot and the implementation at 49130dd; this is an expert review, not a new live accessibility audit or curator usability test.

1. The decision is below the expanded comparison profile. Its gallery height pushes the response controls down, while a large area beside the portrait is empty. Keep a compact evidence/comparison area next to a bounded response area on desktop; stack on narrow screens. A comparison preview should not expand to the full saint-detail-page composition. Code: components/admin/museum-questionnaire.tsx:69–76.
2. Candidate controls repeat identical names and provide no selected-candidate state. Show each candidate with a supported distinguishing place/teacher qualifier and optional small portrait, preserve an explicit selected state, and label the displayed profile. Do not invent qualifiers or imply that viewing a candidate confirms a match. Code: same file, line 69.
3. Introductory copy explains implementation boundaries before the curator's task. Replace with a brief purpose statement; move counting/schema explanations to secondary information. Keep a short, accurate save consequence beside the answer. Code: lines 26–28, 67–69, 75.
4. Hierarchy is too flat. Gold source fact values, gold outlined comparison controls, section headings and question text compete. Use cream for the question and names, muted supporting text, and gold sparingly for selection and the primary action. Bound reading width. Use shared tokens rather than additional page-specific decoration.
5. Administrative controls dominate the start. Refresh should be a quiet utility action, not a peer to the response action. Start with questions needing attention and make saved-answer groups easy to find without exposing all backend statuses at once. Preserve the distinctions between verification, on-site check, research and referral.
6. The answer form exposes an optional text area before it is needed. For an unknown answer, save without typing; reveal an optional note on request. Identification and referral fields appear only for their choices. Keep adequate label hit areas while reducing excess visual separation.
7. After save, the active question disappears and the generic success text sends the curator searching for it. Announce the actual outcome and offer View saved answer / Next question. Manage focus when the saved question leaves the current filter. Preserve all answer history and reopen behavior. Code: lines 30–31, 46–55.

## Initial copy exploration (superseded by purpose review)

- Heading: A few questions about the collection
- Progress: 8 questions to review
- Introduction: Help us identify these entries using what you know about the collection.
- Question: Do you recognize this Mauni Baba from Basak Para, Navadwip?
- Source label: Name in the collection record
- Source location clue: Recorded location
- Location qualifier: From the collection record; not checked in person.
- Relic description in source: Relics listed
- Source evidence and dates: Collection record and research notes
- Compare website profiles: Compare possible matches
- Comparison note: These profiles are for comparison. No match has been confirmed.
- Response heading: Your answer
- Named-person choice: I recognize this saint
- Blank-row choice: I can identify this item
- On-site choice: I can check the label or records
- Unknown choice: I don’t know
- Referral choice: Someone else may know
- Identification save consequence: We’ll review your identification before updating the record.
- Unknown success: Saved for research. You can reopen this question if you learn more.

Do not rewrite quoted/raw source evidence to make it seem cleaner or more certain. Shorter display labels and supporting copy must preserve the distinction between recorded clues, candidate portraits, verified identity and physical location.

No UI behavior or production copy changed in this review.

## Section-planning questions: clarification from Paragata

24 October 2026: questions in the move-planning experience should request the smallest fact that changes a section decision. Exact saint identity is a separate research concern and must not automatically block a preliminary section proposal.

A sufficiently supported tradition, guru relationship, or relevant geographic location can support a preliminary section. Distinguish saint-associated geography, collection provenance and current vitrine/shelf location; they are not interchangeable. Geography alone does not establish a lineage.

Before presenting a question, record:
- What planning evidence is already available and whether it supports a preliminary section.
- The specific missing or disputed fact, the evidence for any doubt, and how different answers affect the proposal.
- A direct question and answer options tailored to that fact, including unknown where appropriate.

Do not ask the curator to confirm a location merely because identity remains unresolved. If existing evidence suffices, make/recommend the supported preliminary proposal through the appropriate workflow and move exact-identity research out of the planning checklist. Preserve explicit evidence-based holds and keep technical failures with the data team.

Mauni Baba / Navadwip is under review with Saarthi: the existing record supplies geographic context; no reason to doubt it has yet been established by this UI review. Do not invent a location conflict to justify the current broad identification question.

## Implemented purpose review

See museum-spn-curator-questionnaire.md for the final routing. The earlier broad identification wording above is retained as review history, not current copy guidance. Only four blank-row collection checks contribute to the default checklist; conflicting identities and optional research have separate views.
