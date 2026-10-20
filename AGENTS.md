# Agent instructions

<!-- BEGIN BEADS RIG -->
## Beads

Work is tracked in **bd (beads)**, stored in this repo.

- Use `bin/bd` (pinned in `mise.toml`). Never a global or Homebrew `bd`.
- Start a session with `bin/bd prime`, then `bin/bd ready`.
- Claim before changing code: `bin/bd update <id> --claim`.
- Found extra work: `bin/bd create "…" --deps discovered-from:<id>`.
- Beads is the only task list. No Markdown TODO lists or loose handoff files.
- Never compact context. Hand off through the bead instead (`bin/bd note` /
  `bin/bd comment`: files touched, tests run, what remains, exact next
  commands), then stop.
- Never run stock `bd setup <agent>`: agent wiring comes from beads-rig.
<!-- END BEADS RIG -->
