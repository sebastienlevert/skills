# HTML authoring contract

The canonical [paper.html](../assets/paper.html) is an offline authoring atlas:
all 83 declared patterns, twelve visual themes, native light/dark appearance,
left navigation, progress, print, exact code copy, responsive SVG cameras and
progressive reader personas. Components are optional inspiration, not a
requirement to fill every specimen.

The seven files in `templates/` are self-contained HTML drafts generated from
the same atlas and [paper type profiles](paper-types.json). They omit the sample
library and include each type's required h3 coverage under five h2 groups.
Recommended and conditional coverage remain in the profile, not fake-filled
sections. Author actual content and add useful optional depth.

## Structure and editable slots

The embedded `paper-template-contract` is the machine-readable reference.
There are nine metadata/footer fields, five heading/body pairs, and
`TERMINOLOGY_HTML`. Text fields are escaped; HTML fields are explicitly authored
markup. Optional JSON input to `paper.py init --content` maps those exact keys:

```json
{
  "TITLE": "A bounded product direction",
  "DESCRIPTION": "The actual reader outcome",
  "BRAND": "Paper",
  "DEK": "A concise proposed direction with its main qualification.",
  "STATUS": "Proposed",
  "DATE": "Undated",
  "AUDIENCE": "Product and delivery readers",
  "SIDEBAR_NOTE": "Decide which proof to pursue.",
  "SECTION_1_HEADING": "Problem, scope and terminology",
  "SECTION_1_HTML": "<div id=\"problem\"><h3>Problem and scope</h3><p>Actual observed context and explicit non-goals.</p></div>",
  "TERMINOLOGY_HTML": "<dl><dt>Proof</dt><dd>A bounded observation, not release approval.</dd></dl>"
}
```

Unspecified content stays visibly marked `[Author: ...]` and cannot pass review.
No dates or owners are invented. HTML slots reject scripts, remote assets and
event-handler injection; escaped code examples remain inert. Preserve source
anchors when editing. For merged coverage use, for example,
`data-paper-covers="method findings"` on an actual authored subsection; do not
add empty aliases to bypass required content.

Keep at most five direct main sections/h2 headings, use h3/h4 for depth, and
place `#terminology` inside the main paper. Definitions use meaningful dt/dd
pairs, not titles or empty placeholders.

## Copy components, not sample claims

Browse the atlas's component finder and expand only relevant examples. Copy
the markup plus its associated JSON data/runtime when required. Keep included
code/data properly escaped and all examples honestly labelled.

| Family | Available patterns |
|---|---|
| Narrative | Decision/proposal callouts, takeaways, goals/non-goals, quotes, notices, FAQ, assumptions, decisions, evidence cards, change log, glossary. |
| Technical | Six diagram layouts, complete build-map/inventory, sequence/dependency views, architecture legend, contracts, file trees, YAML/JSON/JavaScript/CLI code, diffs, tabs, request/response and JSON inspectors. |
| Data | Filtering/sorting/column chooser, matrices, metrics, bar/histogram/time-series charts, heatmap, funnel, scorecards and ownership tables. |
| Planning | Horizontal phase roadmap (vertical on phones), calendar/Gantt, milestones, dependencies, scope cards, risk map, kanban, priorities and synthetic what-if/readiness controls. |
| Interaction | Animated artifact lifecycle, stepper, accessible tabs, option cards, reader depth, keyboard help, empty/error/status feedback and reset behavior. |

Diagrams fit the full world first, including on phones; provide expanded viewing,
fit/reset, keyboard, pinch and pan rather than min-width clipping. Short labels
belong in the diagram, supporting explanations belong in a caption or detail.
Copied SVG IDs, aria references, connectors and `url(#marker)` must stay unique.
The six diagram specimens are examples, not a prescribed architecture.

The artifact viewer is configured by `artifact-viewer-data`; horizontal roadmaps
are data-driven, with stage outcome, deliverables, prerequisites and exit proof.
Keep playback, stage selection and scenario changes browser-local and synthetic.
Never imply their controls start a service, upload files, grade real output,
approve gates or change a schedule.

## Theme and reader defaults

Set `paper-default-palette` to Azure, Forest, Plum, Ember, Slate, Rose, Ocean,
Indigo, Olive, Terracotta, Graphite or Sand (lowercase IDs). `paper.py init`
accepts `--palette`. Readers may override the palette and light/dark appearance;
**Use default** clears their local override.

The atlas's author configuration exports the configured, self-contained source.
Export normalizes injected controls/cameras so reopening does not duplicate them.
Do not export a reader's expanded temporary state as an author requirement.
Themes change color, offline system-font stacks, spacing, reading measure,
header/metadata placement and card/table density through CSS. They do not change
HTML structure, content, controls or reading order. The left navigation stays
left; desktop metadata rails become ordinary stacked headers on phones.
Code and SVG labels keep their stable technical fonts. Print keeps a readable
single-column layout with the chosen typography.

The [theme preset data](theme-presets.json) defines these treatments:
editorial Forest/Rose, studio Plum, briefing Ember/Slate/Graphite, technical
Indigo, wide Ocean, and book/field-guide Olive/Terracotta/Sand. Azure retains the
balanced default. These are style choices, not mandatory paper-type assignments.
Keep source defaults, reduced motion, mobile fit and safe storage fallback.

Retain `paper-default-reader=overview` and `#paper-reader-persona`. Level 1 details
open for Product/delivery; level 2 for Technical/evidence. Per-section controls
can override either. Deep links reveal ancestor details. Terms and decisive
qualifications remain in the overview; advanced code/inventories may collapse.
Use `data-paper-critical="true"` on material caveats for a deterministic
collapsed-caveat check.

## Regeneration and validation

```text
python "<skill-base>\scripts\paper.py" templates --check
python "<skill-base>\scripts\paper.py" themes --check
python "<skill-base>\scripts\paper.py" themes
python "<skill-base>\scripts\paper.py" templates
```

When intentionally changing theme presets, build their CSS/embedded contract
with `themes`, then regenerate the seven starters. `templates` replaces only
those named generated files. Normal paper creation never rebuilds the atlas.
Final papers still need the [integrated light review](review.md), not just a
successful generation or a format check.
