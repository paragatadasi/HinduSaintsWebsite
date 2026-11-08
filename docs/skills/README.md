# Reusable workflow skills

The versioned copies in this directory are the project source of truth. Agents can read them directly; a skill need not be installed or auto-discovered to follow its instructions.

| Task | Read |
| --- | --- |
| Diagnose slow multi-user saves, polling or shared reads | [Collaborative workflow performance](collaborative-workflow-performance/SKILL.md) |
| Implement or verify an approved prototype | [Prototype production fidelity](prototype-production-fidelity/SKILL.md) |

AGENTS.md routes relevant work here. Museum aesthetics and component choices remain in the canonical design system; measurements and implementation details remain in project performance contracts. These skills do not authorize deployment or data changes.

## Optional use in other projects

Copy an individual skill directory to the host's configured Codex skills directory (normally ~/.codex/skills). Check for an existing copy and compare it before replacing it. Restart or refresh skill discovery as supported by that host; do not assume an already-running chat has refreshed its catalogue.

Installation is local to that host, not synchronized to other machines or cloud sessions. On another host, either read the repository copy directly or install it there. Do not commit credentials, live museum records or machine-specific paths into skills.

## Maintenance

Change the repository copy first, with a concrete example showing why the decision procedure needs to change. Validate frontmatter and relative links; exercise representative behavior for substantive changes. Sync installed copies deliberately after review. Avoid editing third-party skills to carry project-specific lessons.

The initial host copies were installed on 8 November 2026. Repository changes do not automatically update those copies.
