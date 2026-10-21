# Designer roles

Use these reusable instructions when assigning design work on the Hindu Saints Website. These are responsibilities, not CMS permission roles. They do not grant publishing, deployment, or access privileges, and do not require separate people or agents.

## Choose the role

- **Admin / Workflow Designer:** use [the admin role guide](admin-workflow-designer.md) for protected editorial tools, review, reconciliation, and publishing workflows.
- **Public Experience Designer:** use [the public role guide](public-experience-designer.md) for visitor-facing pages and experiences. Explicitly select Editorial mode, Creative mode, or both.
- For mixed work, name one owner for the complete journey and identify the contribution of each role. The public designer owns the complete public page, including embedded creative experiences.

Example assignments:

> Act as the Admin / Workflow Designer. Follow docs/design/admin-workflow-designer.md. Improve the source reconciliation workflow, beginning with the reviewer decision and error states.

> Act as the Public Experience Designer in Editorial mode. Follow docs/design/public-experience-designer.md. Improve biography reading hierarchy using shared saint templates.

> Act as the Public Experience Designer in Creative mode, with an Editorial integration review. Follow docs/design/public-experience-designer.md. Explore how visitors could discover relationships between saints and traditions. Prototype the uncertain interaction before proposing production implementation.

## Shared practice

1. Read AGENTS.md, docs/design-system.md, and relevant domain/workflow documentation before proposing changes. Inspect existing components and the affected journey. Respect existing approved visual direction.
2. State the audience, need, context, desired outcome, constraints, and assumptions. Separate observed evidence, research guidance, and design hypotheses. Do not invent user research or claim that an expert review is user validation.
3. Begin with existing tokens, shared classes, configuration, and reusable components. Repeated patterns belong in the design system. Theme changes use tokens. Explain any genuinely unique pattern.
4. Treat accessibility as a design input. Target WCAG 2.2 AA: keyboard operation, visible and unobscured focus, semantic structure, labelled controls, adequate contrast and targets, understandable errors, and alternatives to pointer-only interaction. Respect reduced-motion preferences. Automated checks alone do not establish conformance.
5. Cover narrow screens, zoom/reflow, long and missing content, loading, empty, success, error, and recovery states as applicable. Avoid relying on hover, motion, or colour alone to communicate meaning.
6. Treat performance as part of design. Control image and animation costs; assess loading, responsiveness, and layout stability. Use Core Web Vitals as measurable signals, distinguishing lab results from real-user evidence.
7. Preserve content and security boundaries. Public content follows AGENTS.md publication rules, including its limited basic-tradition exception. Never expose museum/relic fields or private editorial material. Preview requires authentication and noindex. Design never substitutes for server authorization.
8. Use respectful language and imagery for living religious traditions. Preserve sources, distinguish historical claims from tradition-specific accounts, and ask for editorial judgment where meaning or representation is uncertain.
9. Validate representative tasks with the relevant users where available. Otherwise report the expert-review findings and the remaining testing needs. Follow repository verification requirements for implementation; document-only changes do not require an application build.

## Expected handoff

Scale the handoff to the task. Include the role/mode, problem and evidence, proposed flow or composition, states and responsive behavior, shared components/tokens affected, accessibility considerations, validation performed, and unresolved decisions. For exploratory work, label prototypes and assumptions clearly. Do not add process paperwork that does not help assess the design.

## Research foundation

These guides synthesize the sources below with this project's rules and the team's role discussion. The staffing split and mode definitions are project recommendations, not claims that these sources prescribe this organization.

- [Government Design Principles](https://www.gov.uk/guidance/government-design-principles): user needs, context, iteration, and reuse.
- [Nielsen Norman Group: usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): system status, familiar language, consistency, control, error prevention, and recovery.
- [Nielsen Norman Group: progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): defer secondary complexity while retaining access to it.
- [W3C WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/): accessibility standards and evaluation resources.
- [Google Web Vitals](https://web.dev/articles/vitals): loading, responsiveness, and visual stability.

Research reviewed 21 October 2026. Recheck authoritative guidance when standards or platform behavior materially affect a new assignment. These files provide reusable project guidance; they do not retrain an AI model or replace observation of actual users.
