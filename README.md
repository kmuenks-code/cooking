# Cooking Curriculum

A structured curriculum for becoming a better home cook, built around one goal:
being able to open the fridge and cook something good without looking anything
up.

Twelve modules run in parallel rather than in sequence. Progress is tracked per
sub-module, in two stages — you **study** a sub-module by reading it, and you
**graduate** it by cooking something that uses it and writing a journal entry.
Studying unlocks recipes. Graduating unlocks the next sub-modules.

## Reading it

The site is published to GitHub Pages on every push to `main` — that is the copy
to open on a phone. Progress and the cook journal are stored in that browser, so
each device keeps its own; the Journal page has Export and Import for moving
them or backing them up.

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. `npm run validate` checks the content graph,
and `npm run build` writes the static site to `out/`.

## Deployment

`.github/workflows/deploy.yml` builds the static export and publishes it. It
needs Pages switched on once, in **Settings → Pages → Build and deployment →
Source: GitHub Actions**. The workflow derives the base path from the repository
name, so nothing hardcodes the URL.

## Status

Graph drafted, two vertical slices written, app scaffolded and working end to end.

- [x] Skill graph — 12 modules, 139 sub-modules, 234 prerequisite edges, acyclic
- [x] Content model and architecture decisions
- [x] **Slice 1 — 14 lessons to Pan-Seared Chicken with Pan Sauce**
- [x] **Slice 2 — 14 lessons to Rigatoni with Soffritto Tomato Sauce**
- [x] `knife.onion-dice` — the format proposal, written before either closure
- [x] Validation script (`npm run validate`)
- [x] App — dashboard, map, lesson pages, recipes, journal, progress tracking
- [x] Static export, mobile layout, and GitHub Pages deployment
- [x] 17 authored recipes, each built around one technique
- [x] Video IDs for every lesson slot (77 of 77 filled). Each one was confirmed
      embeddable against YouTube's oEmbed endpoint, and the stored `title`/
      `channel` are the values oEmbed returned — not what search claimed. See below
- [ ] Images — every slot is `TODO`, 72 of them
- [ ] Cook the recipes and flip `origin.tested` — all 17 are untested
- [ ] Lessons for the other 110 sub-modules

## The app

| Route | What it does |
| --- | --- |
| `/` | What is available now, what is studied and awaiting a cook, recent journal entries |
| `/map` | All 12 modules, grouped by tier, with lock state and what is blocking each |
| `/lesson/[id]` | Lesson prose, video embeds, image slots, practice prompt, study toggle |
| `/recipes` | Unlocked and locked recipes, with the skills each one requires |
| `/recipes/[id]` | Ingredients, method with per-step links back to lessons, and the why |
| `/journal` | Cook log, the new-entry form, and export/import |

There is no server. `next build` prerenders all 164 pages — the curriculum, every
lesson, every recipe — and everything that depends on your progress is computed
in the browser from `localStorage` (`lib/derive.ts` holds those rules, and
`components/Store.tsx` holds the state). Lesson and recipe prose is baked in at
build time; only the badges, locks and journal are client-side.

The layout is built for a phone first: at narrow widths the nav becomes a fixed
bottom tab bar, and cards, stats and tables reflow to a single column.

## Layout

```
docs/
  decisions.md      Architecture decisions and why
  content-model.md  File formats, ID scheme, progression rules
content/
  curriculum/       The skill graph. 12 YAML files.
  lessons/          Lesson prose. MDX.
  recipes/          Authored recipes. MDX.
lib/
  content.ts        Reads content/ at build time. Server only.
  derive.ts         Lock/unlock rules. Pure, runs in the browser.
```

Cook logs live in the browser rather than in this repo — see `docs/decisions.md`
D6.

Start with `docs/content-model.md`.

## The vertical slices

Rather than writing 139 lessons and then discovering the model is wrong, each
milestone is one complete path from what already exists to a genuinely unlocked
recipe. Two are written.

### Slice 1 — Pan-Seared Chicken with Pan Sauce

The closure of the target recipe's `skills.required` is exactly 14 sub-modules,
running across four modules in parallel:

```
  FOUNDATIONS                 HEAT                  FLAVOR              SAUCES

  safety-sanitation ─┬─ mise-en-place
                     └─ pan-selection ─┬─ heat-control ─┬─ doneness
                                       │                └─ transfer-fundamentals
                                       │                        │
                                       └────────────────────────┴─ fat-as-medium
                                                        │              │
                                            searing-maillard ──────────┤
                                                        │              │
  tasting-and-adjusting ─┬─ salt ───────────────────────┼──────────────┤
                         └─ acid ───────────────────────┤       fat-as-flavor
                                                        │              │
                                                        │   what-a-sauce-does
                                                        │              │
                                                        └───── pan-sauce
                                                                       │
                                                                       v
                                        Pan-Seared Chicken Thighs with Pan Sauce
```

Three entry points, four modules advancing at once, and cross-module edges doing
real work — which is the behavior the whole design rests on. This path exercises
every mechanism in the system: lesson rendering, video embeds, cross-module
prerequisites, the unlock rule, recipe tagging, and the journal.

If it feels good, widen. If it does not, we lost fourteen lessons instead of a
hundred and thirty-nine.

### Slice 2 — Rigatoni with Soffritto Tomato Sauce

It felt good, so we widened. The second slice is another 14 sub-modules, chosen
to do three jobs at once: complete the knife module's spine (which slice 1 had
skipped past — `knife.onion-dice` was written with none of its prerequisites),
open the two modules that had no lessons at all, and prove that a slice can build
on an existing one rather than starting from the root.

```
  KNIFE                 HEAT              FLAVOR         INGR / PREP / SAUCE

  anatomy-selection
        │
    grip-stance
        │
  cutting-motions
        │
  [onion-dice]* ─┬─ uniform-cuts ─────────────────────┐
                 │                                    │
                 └──────────────── aromatics-alliums ─┴─ aromatic-bases
                                          │                     │
  [searing-maillard]* ─── saute ──────────┘                     │
                                                         umami ─┴─ tomato
  [transfer-fundamentals]* ─ dry-vs-moist ─ boiling-simmering    │
                                                    │            │
  [tasting-and-adjusting]* ─ measuring ─ flour-gluten┴─ pasta ────┤
                                                                 │
                                                                 v
                              Rigatoni with Soffritto Tomato Sauce
```

`*` are slice-1 nodes. The full closure is 23 sub-modules, of which 9 already
existed — so the graph did what it was designed to do, and the second path cost
14 lessons rather than 23.

Seven modules advance at once here, against four in slice 1. Ingredient
Fundamentals and Core Preparations get their first lessons, and the four new
recipe vehicles are deliberately weighted toward the techniques that fail
silently: a crowded pan, an under-sweated base, and a pasta emulsion that never
formed.

## Videos

Every lesson carries two or three embeds, chosen to do different jobs — one that
demonstrates the technique, one that explains the mechanism, and where the
lesson names a live disagreement, one that argues the other side. `found.measuring`
leads with Ragusea's case *for* volume measurement; `flavor.aromatics-alliums`
pairs the fast and slow caramelized-onion methods. That is deliberate, per the
prose convention about admitted uncertainty beating manufactured consensus.

Only `youtube_id` is stored, never a full URL, so the embed component controls
privacy parameters (`youtube-nocookie`) and a checker has a clean key.

**Checking them.** YouTube's oEmbed endpoint is the cheap oracle, and its status
code distinguishes the three failure modes:

| Code | Means | Embed shows |
| --- | --- | --- |
| 200 | Fine | The video |
| 401 | Exists, but **embedding is disabled** | "Video unavailable" |
| 400 / 404 | Bad or deleted ID | "Video unavailable" |

The 401 case is the one to watch for: the link works in a browser and the video
is real, so eyeballing it tells you nothing, but the embed is broken. One
slice-1 entry was in exactly that state and was caught this way. Re-run
occasionally, since videos get deleted, go private, or have embedding revoked:

```bash
for f in content/lessons/*/*.mdx; do grep -o 'youtube_id: *[^ ]*' "$f" | sed 's/youtube_id: *//' | tr -d '\r' | while read id; do code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 "https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D$id&format=json"); [ "$code" = "200" ] || echo "BROKEN ($code) $id in $f"; done; done; echo "scan complete"
```

## Ground rules

- **Recipes are written here, not collected.** Each one exists to make a
  specific technique unavoidable, and carries `tested: false` until cooked.
- **Every image carries a credit.** No exceptions, including the ones we shoot.
- **AI-assisted work starts `reviewed: false`** and is marked as such in the UI
  until a human confirms it.
- **Explain the mechanism, then the procedure.** The "why" is the product.
