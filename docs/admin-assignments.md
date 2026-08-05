# Admin assignments

`/admin/work` is the shared assignment workspace and personal dashboard for
Saints, Traditions, Places, and Instagram posts.

- Site Admins, Data Admins, and Editors have `manage_assignments`. They can
  create available work, assign or reassign active users, and inspect Team Workload.
- Contributors can claim available work and update only assignments assigned to
  them. Translators remain view-only and cannot claim editing work.
- A null assignee with state `assigned` means the task is available for
  self-assignment. Lifecycle states remain `assigned`, `in_progress`, `blocked`,
  `completed`, and `cancelled`.
- Separate assignment rows allow several collaborators and task types on the
  same content record.
- Completing an assignment records `completedAt` and `completedById`. It never
  changes the content record or publishes it. Publication still requires the
  existing `publish_content` capability and domain-specific publishing action.

The dashboard sections are My Work, Available Work, Blocked, Recently
Completed, and Team Workload for assignment managers. The main admin dashboard
and navigation show personalized assignment counts.
