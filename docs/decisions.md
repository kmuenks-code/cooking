# Architecture Decisions

Running log. Each entry states the decision, the reasoning, and what it forecloses.

## D1 — Single user now, multi-user-shaped later
Built for one user (local, no auth). But all progress and journal data is kept
behind a single data-access module and keyed by a `user` field that is hardcoded
to `"me"` for now. Sharing later means swapping the storage backend, not
rewriting the app.

## D2 — Sub-module is the unit of progress
Modules are containers for navigation and framing only. Every prerequisite edge,
every unlock, and every journal entry attaches to a sub-module. Roughly 140
sub-modules across 12 modules.

## D3 — Two-state progression: studied -> practiced
Each sub-module has two independent states.

- **studied** — you read the lesson and watched the videos. Self-attested.
- **practiced** — you cooked something that used the technique and wrote a
  journal entry against it. This is "graduation."

## D4 — Study unlocks recipes; graduation unlocks curriculum
This resolves a circular dependency. If recipes required graduation, and
graduation required cooking a recipe, nothing would ever open.

- A recipe becomes available when **all** of its tagged skills are `studied`.
- A sub-module becomes available when all of its prerequisites are `practiced`.

So: study a skill, immediately get recipes that use it, cook one, journal it,
and that opens the next tier. The loop is study -> cook -> unlock.

## D5 — Content lives in git as files, not in a CMS
Curriculum graph: YAML, one file per module. Lessons: MDX. Recipes: MDX with
YAML frontmatter. This keeps the content layer framework-agnostic —
none of it is coupled to whatever renders it — and gives version history,
diffable edits, and grep for free.

## D6 — Journal entries live in the browser (supersedes writing them to the repo)
**Revised.** Entries were originally Markdown files written to
`content/journal/`, on the reasoning that hand-written cook notes are the
least-replaceable data here and git should be the backup.

Why the change: the notes are only worth writing if they get written, and they
get written standing at the stove holding a phone. A disk write path means a
server, a server means running the thing on a laptop, and a laptop is not in the
kitchen. Reading and logging from a phone is worth more than the repo being the
store of record.

So the site is a static export on GitHub Pages, and both the journal and
`studied` live in `localStorage` under one key. The cleared-cache risk is real
and answered directly: the Journal page exports the whole state as JSON and
imports it back, which is also how progress moves between devices.

Consequence: progress is per-browser, not per-person. Accepted — this is a
single-user tool and the export is one tap.

## D7 — Progress state is one JSON blob
One `localStorage` key, one shape: `{ version, studied[], journal[] }`. Small,
human-readable, and the same document that Export writes out, so what you back
up is exactly what the app holds. `version` is there so an old export can be
migrated rather than rejected.

`practiced` stays derived from the journal rather than stored (see D3) — there
is one record of having cooked something, not two that can disagree.

## D8 — Recipes are authored here (supersedes the external-link approach)
**Revised.** Recipes were originally external links plus local metadata, with
skills inferred from someone else's recipe. They are now written as original
content in `content/recipes/*.mdx`, same shape as lessons.

Why the change:

- **The decomposition becomes exact rather than inferred.** A recipe written to
  a set of skills genuinely requires those skills. A recipe found on the web and
  tagged afterward is a guess, and the unlock feature is only as good as its
  tags.
- **No link rot.** An entire class of maintenance disappears, along with the
  `link_status` field and the link checker it implied.
- **They can be edited.** Steps can be rewritten to reference a lesson, or
  retuned as the curriculum changes. Someone else's recipe cannot.
- **No copyright surface at all**, rather than a carefully managed one.

Cost: an authored recipe is not a tested recipe. Every recipe carries
`origin.tested: false` until it has actually been cooked, and the UI marks
untested recipes visibly. Flipping that flag is a real editorial act, not a
formality.

External links are still allowed as *references* on a recipe — "here is someone
doing this differently" — but they are never the recipe itself.

## D8a — Steps can cite the skill they exercise
Each step may carry an optional `skill` id. That renders as a link back to the
lesson, so a recipe is a path through the curriculum rather than a detour from
it. It is also a cheap consistency check: if a step cites a skill the recipe
does not list, validation catches it.

## D9 — Skill IDs are a controlled vocabulary
Recipe decomposition can only tag against IDs that exist in
`content/curriculum/`. AI-assisted tagging validates against that list and fails
loudly on unknown IDs rather than inventing skills.

## D10 — Framework decision deferred
The content layer above is portable. The renderer gets chosen when the app is
scaffolded; current lean is Next.js run locally, for the write path in D6.
