# Content-first HTML paper

## Visual identity

A calm, modern reading surface, not a marketing landing page or dashboard.
Use neutral light/dark palettes, one restrained accent, generous whitespace and
system fonts. No product-specific identity, gradients, neon, hero illustrations,
external font downloads or decorative motion.

- Keep prose around 65-75 characters wide, with generous line height.
- Establish hierarchy through type, spacing and a small set of semantic styles.
- Keep the thesis and decision request visible near the beginning.
- Prefer normal paragraphs; reserve callouts for decisions, evidence gaps and
  material risks. Do not turn every paragraph into a card.
- Use responsive tables with clear headers and a contained horizontal overflow
  area when needed. Never let a table expand the whole page on a phone.

## Reader controls

- Default to the operating system's light/dark preference. Offer System, Light
  and Dark choices with an accessible label. Persistence is optional enhancement:
  storage errors must not break reading or theme changes.
- Keep the TOC compact, floating and collapsible. Open it on wide screens; on
  narrow screens keep it collapsed until requested. Highlight the active section
  without moving keyboard focus or continually scrolling the document.
- Generate links from actual H2/H3 headings, with unique anchors. Keep the
  executive brief easy to find. Do not ship stale preview links after editing.
- Show an **estimated** reading time and word count. The template uses 230 words
  per minute and excludes code blocks and diagrams; it is not a measured promise.
- A thin reading-progress indicator is enough. Do not add a sticky control bar
  that consumes a large part of the reading viewport.
- Respect reduced motion, visible keyboard focus and the user's zoom settings.
  Content, native anchor links and the TOC remain usable without JavaScript.

## SVG-only visuals

Use inline SVG for every diagram and chart. Give it a `viewBox`, descriptive
`role="img"`, accessible title/description, readable labels and a caption explaining
the inference. Support both themes using shared CSS color variables.

Do not embed PNG/JPEG/WebP, base64 raster content, remote images, SVG `<image>`,
`foreignObject`, script, external references or remote styles. A complex diagram
is a reason to simplify or split it, not to make text unreadably small.

Prefer labeled flows, layers, ownership boundaries, comparisons and timelines that
explain the paper's mechanism. Do not add a diagram solely to decorate a page.
Show sources and units for charts; mark conceptual diagrams as conceptual.

## Offline, accessible, shareable

The deliverable is one HTML file with inline CSS, lightweight inline reader code,
inline SVG and the entire narrative. No framework, bundler, CDN, tracking,
network request or external runtime dependency. Source citations may link out,
but opening and reading the paper must not require a connection.

Use semantic headings/landmarks, a skip link, accessible control names and clear
contrast in both themes. Print should become a clean light document with controls
hidden, useful page breaks, and legible tables and diagrams.

Treat publication separately from generation. Do not upload a paper or create a
sharing link automatically. Do not include private notes or unsupported claims
simply because the HTML makes them look polished.
