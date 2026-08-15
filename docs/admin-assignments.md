# Admin assignments

`/admin#my-work` is the shared assignment workspace inside the Dashboard for
Saints, Traditions, Places, and Instagram posts. Legacy `/admin/work` URLs
redirect to the matching embedded queue.

- Site Admins, Data Admins, and Editors have `manage_assignments`. They can
  create available work, assign or reassign active users, and inspect Team Workload.
- Contributors can claim available work and update only assignments assigned to
  them. Translators remain view-only and cannot claim editing work.
- Fact-checkers may hold only one `assigned` or `in_progress` task at a time.
  Once that task is blocked or completed, they may claim another from the
  relevant content review page.
- A null assignee with an active state means the task is available for
  self-assignment. Lifecycle states are `assigned`, `in_progress`, `blocked`,
  and `completed`; an available task retains its active state.
- An assignee can leave any active task. Leaving preserves the task and its
  editorial notes, task status, blocking reason, and content edits. It clears
  only the assignee and makes the task claimable from its content review page.
- Separate assignment rows allow several collaborators and task types on the
  same content record.
- Completing an assignment records `completedAt` and `completedById`. It never
  changes the content record or publishes it. Publication still requires the
  existing `publish_content` capability and domain-specific publishing action.

The Dashboard separates shared editorial counters under Team Workflow from
personal assignment counters under My Workflow. Its embedded assignment section
contains Active, Blocked, Completed, and Team Workload for assignment managers.
Available work is claimed from the relevant content review page. Queue tabs keep
normal URLs through the `work` query parameter and target the `#my-work` section.
