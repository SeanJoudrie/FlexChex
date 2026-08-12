# FlexChex

Shared build-schedule tracker for Flexyn — the checklist Sean and Kegan work off.

**Live page:** https://raw.githack.com/SeanJoudrie/FlexChex/claude/flexyn-build-schedule-tracker-tojifb/index.html

Open the link on any device. Tick a box or leave a comment and the other person
sees it within about five seconds. A small pill in the bottom-right corner shows
`shared · saved` when it is in sync, or `offline` if the network drops — in which
case the page keeps working locally and pushes the changes once it reconnects.

## What's here

`index.html` — the whole thing. One self-contained file, no build step, no
dependencies. All 176 tasks, owner colour-coding, per-task comment threads with
image paste/drag, filters, and the deadline table.

## Where the shared state lives

Its own Supabase project, `FlexChex-Tracker` (`sjqzmwlxuuccguymougc`) — one row
per task, holding that task's checkbox and its comment thread. Because the row is
per-task, two people working on different tasks can never overwrite each other.

**This is completely separate from the Flexyn app.** Different project, different
database, different credentials. Nothing here reads from, writes to, or depends on
the Flexyn production database in any way.

## Access

Anyone with the page link can tick boxes and comment — the same model as a Google
Doc shared by link. The link is unlisted, but it is not password-protected.

## Resetting

"Clear all checkmarks" in the toolbar clears the boxes for everyone. To wipe
everything including comments, run `delete from public.tasks;` against the
FlexChex-Tracker project.
