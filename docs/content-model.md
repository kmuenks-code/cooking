# Content Model

Everything in `content/` is plain text in git. No database, no CMS. The renderer
is chosen later and reads these files; nothing here is coupled to a framework.

```
content/
  curriculum/    12 YAML files, one per module. The skill graph.
  lessons/       MDX, one per sub-module. Prose, images, video embeds.
  recipes/       MDX, one per recipe. Authored here, with skill tags.
```

Progress and the cook journal are not in here — they live in the reader's
browser, because the app is a static site. See `decisions.md` D6.

## Skill IDs

Format: `<module-prefix>.<slug>`.

| Module | Prefix |
| --- | --- |
| Foundations | `found.` |
| Knife Skills | `knife.` |
| Heating and Cooking Methods | `heat.` |
| Flavor Fundamentals | `flavor.` |
| Ingredient Fundamentals | `ingr.` |
| Core Preparations | `prep.` |
| Sauces and Emulsions | `sauce.` |
| Culinary Traditions | `cuisine.` |
| Dish Construction | `dish.` |
| Troubleshooting | `trouble.` |
| Recipe Adaptation | `adapt.` |
| Recipe Design | `design.` |

These IDs are the controlled vocabulary. Recipe decomposition, lesson
frontmatter, journal entries, and progress state all reference them. **Renaming
an ID is a breaking change** — it must be updated everywhere at once, so prefer
changing a `title` and leaving the `id` alone.

## Curriculum YAML

One file per module. Each sub-module carries:

- `id` — controlled vocabulary, see above
- `title` — display name, freely editable
- `tier` — 1 beginner, 2 intermediate, 3 advanced. Drives the default ordering
  when several sub-modules are available at once.
- `prereqs` — list of sub-module IDs that must be **practiced** first. Cross-module
  edges are normal and are what makes the paths parallel rather than linear.
- `why` — one line on what this exists to teach. Shown in the graph view.
- `practice` — the journal prompt. What you have to cook to graduate.

## Progression rules

Two independent states per sub-module.

| State | Set by | Meaning |
| --- | --- | --- |
| `studied` | Self-attested checkbox | You read the lesson and watched the videos |
| `practiced` | Writing a journal entry | You cooked with it. This is graduation. |

- A sub-module is **available** when every one of its `prereqs` is `practiced`.
- A recipe is **unlocked** when every skill in its `skills.required` is `studied`.

Study opens recipes, cooking opens curriculum. This is deliberate: if recipes
required graduation and graduation required cooking a recipe, nothing would ever
open. See `decisions.md` D4.

## Lesson MDX

Frontmatter carries structure, the body carries prose. Key fields:

- `objectives` — what you should be able to do afterward. Written first; the
  prose is written to serve them.
- `practice` — mirrors the curriculum YAML's prompt, plus `criteria` the journal
  entry should address. **The YAML is the source of truth**; a build check
  should flag drift between the two.
- `videos` — external embeds. `youtube_id` only, never a full URL, so the embed
  component controls privacy parameters and the link checker has a clean key.
- `images` — every entry needs `alt` and `credit`. Credit is not optional; it is
  how we stay on the right side of licensing.
- `reviewed` — `false` until a human has read the draft. Unreviewed lessons are
  visibly marked in the UI.

### Prose conventions

- Explain the mechanism before the procedure. "What is happening" earns the
  "what to do."
- Say when experts disagree, and say who. Manufactured consensus is worse than
  admitted uncertainty.
- Prefer a table when the content is a decision with more than two options.
- Name the failure modes explicitly. Most of the value is in knowing what goes
  wrong and why.

## Recipes

Authored here, not linked. One MDX file per recipe in `content/recipes/`.
See `decisions.md` D8 for why this changed.

Frontmatter carries the structure; the body carries the narrative.

- `skills.required` — **gates the unlock.** Every one must be `studied` for the
  recipe to appear. Put a skill here only if the recipe genuinely cannot be
  executed without it.
- `skills.reinforced` — exercised but not required. Feeds "recipes that practice
  X" lookups and does not gate anything.
- `primary_practice_for` — the one sub-module this recipe is the best vehicle
  for. Surfaced when that skill is studied but not yet practiced.
- `ingredients` — structured, each with `amount`, `item`, an optional functional
  `role`, and an optional `note`. The roles feed the future pantry-first tool.
- `steps` — each with `text` and an optional `skill` id, which renders as a link
  back to the lesson. Validation warns if a step cites a skill the recipe does
  not list.
- `origin.tested` — **false until someone has actually cooked it.** Untested
  recipes render a visible banner. Flipping this is an editorial act.
- `references` — optional outside links, as references only. Never the recipe.

Getting `required` versus `reinforced` wrong either hides a recipe that should
be available or surfaces one the user cannot actually cook, so it is the field
worth most care.

## Saved state

Held in `localStorage` under `cooking-curriculum/v1`, and the same shape that the
Journal page's Export and Import move around.

```json
{
  "version": 1,
  "studied": ["sauce.pan-sauce"],
  "journal": [
    {
      "id": "mtv04hib-y8pmho",
      "date": "2026-09-08",
      "skill": "sauce.pan-sauce",
      "recipe": "pan-seared-chicken-pan-sauce",
      "rating": 3,
      "body": "What happened, what surprised me, what I would change."
    }
  ]
}
```

`recipe` and `rating` are optional; `rating` is 1-5. `practiced` is not stored —
it is derived from the skills the journal mentions.

Writing one flips that skill to `practiced`. A skill can have many entries;
the first one graduates it, the rest are the record of getting better.

## Validation

`npm run validate` enforces, and fails non-zero on:

- Every `id` is unique across all modules.
- Every `prereqs` and `recommended` entry resolves to a real sub-module.
- The prerequisite graph is acyclic.
- Every lesson `id` matches a curriculum sub-module.
- Every recipe skill tag and `primary_practice_for` resolves.
- Every recipe has both ingredients and steps.
- Every step's optional `skill` resolves.
- Every image has `alt` and `credit`.

Warnings, which do not fail the run:

- Lesson frontmatter `prereqs` drifting from the curriculum YAML.
- A step citing a skill the recipe does not list in `skills`.

It also reports media completeness — filled versus unfilled video and image
slots, and unreviewed lesson count — since that is what rots quietly.
