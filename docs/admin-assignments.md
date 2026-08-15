# Admin assignments

`/admin#my-work` is the shared assignment workspace inside the Dashboard for
Saints, Traditions, Places, and Instagram posts. Legacy `/admin/work` URLs
redirect to the matching embedded queue.

- Site Admins, Data Admins, and Editors have `manage_assignments`. They can
  create available work, assign or reassign active users, and inspect Team Workload.
- Contributors can claim available work and update only assignments assigned to
  them. Translators remain view-only and cannot claim editing work.
- A null assignee with state `assigned` means the task is available for
  self-assignment. Lifecycle states remain `assigned`, `in_progress`, `blocked`,
  `completed`, and `cancelled`.
- An assignee can leave any active task. Leaving preserves the task and its
  editorial notes, clears its assignee and blocking/completion metadata, and
  returns it to the Available Work queue in the `assigned` state.
- Separate assignment rows allow several collaborators and task types on the
  same content record.
- Completing an assignment records `completedAt` and `completedById`. It never
  changes the content record or publishes it. Publication still requires the
  existing `publish_content` capability and domain-specific publishing action.

The Dashboard separates shared editorial counters under Team Workflow from
personal assignment counters under My Workflow. Its embedded assignment section
contains My Work, Available Work, Blocked, Recently Completed, and Team Workload
for assignment managers. Queue tabs keep normal URLs through the `work` query
parameter and target the `#my-work` section.
