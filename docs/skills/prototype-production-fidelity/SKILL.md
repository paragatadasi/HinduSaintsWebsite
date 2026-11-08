---
name: prototype-production-fidelity
description: Carry an approved interactive prototype into a production interface without visual or behavioral drift. Use when implementing an accepted design or comparing a deployed view against its prototype.
---

# Prototype to production fidelity

1. Locate the accepted prototype/version and user decisions. Read the project's canonical design index and inspect actual tokens, components and call sites. Do not invent component variants from documentation examples.
2. Record the task and invariants: hierarchy, density, responsive composition, color meaning, control placement, persistent state and action semantics. Project-specific aesthetics belong in project docs.
3. Resolve uncertain workflow choices with genuinely different interactive options; do not reopen approved choices merely because a new skill suggests another style.
4. Implement through existing shared components/tokens. If live data needs a departure, explain the concrete reason rather than silently substituting a generic layout.
5. Compare at matching viewport, data and state. Include long names, large branching groups, multiple groups, empty views, pending and failed saves, narrow widths and the least-privileged relevant role.
6. Exercise the actual interaction: keyboard/touch, selection persistence, validation and retry, remote update while editing. A screenshot cannot prove these.
7. Record fidelity checks and any untested states in the handoff. Separate implementation completion from deployment and production verification.

Use prototyping for unresolved interaction choices; foundations/typography for hierarchy; forms/copy for action and recovery; accessibility for input modes; performance for measured lag. Read only applicable skills. Treat version-specific examples as examples to verify, not instructions to replace the project's architecture.

Good: preserve the accepted map-and-detail composition while replacing sample data.
Bad: rebuild it as stacked cards and defer visual fidelity until after launch.

