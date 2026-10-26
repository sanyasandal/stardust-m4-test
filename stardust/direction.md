<!-- stardust provenance: written by stardust reskin (M4, Figma-only site) · input: "migrate figma design One AZ v3.2 to EDS — build all pages in the design, all kit blocks in the library, pages exactly as in Figma" · authored: deviations + assumptions · read: state.json, reskin/figma-pages.json, reskin/figma-renders.json, migration-log.md -->

# Direction — One AZ v3.2 → EDS

**Flow:** `reskin` (`flowSource: figma-only`). The design is kept exactly: Figma is both the content source and the
design system (M4: content from Figma for a Figma-only site). No redesign axis moves.

**Scope (user-directed):**
- Every page in the design's FULL PAGES canvases (31 pages × desktop/tablet/mobile = 93 frames), not only the linked node.
- Blocks are formed from the COMPONENTS and TEMPLATE SECTIONS kit: one EDS block per kit canvas (32 blocks).
- All 32 blocks go in the block library (`/library/<block>`), whether a page uses them or not (248 variants).
- Exactness bar: each page frame and each kit variant is gated against Figma's own PNG render.

## Named deviations

| # | Deviation | Replaces | Why | Lives in |
|---|---|---|---|---|
| D1 | Lexia → Roboto Slab stand-in, width-matched; Inter 3.19 | the donor heading font; Figma's Inter build | Lexia (Dalton Maag) is licensed and not in the Figma file or available as a webfont; Roboto Slab (OFL) is the closest slab serif. Measured against Figma, Roboto Slab is ~4.3 % wider at 400 and ~1.1 % at 500+, so two `@font-face` rules apply `size-adjust` 95.8 % (100–449) and 98.9 % (450–900). Figma renders Inter 3.x (ink widths 339/339/303/215 px vs 3.19: 339/340/303/215, 4.x: 342/338/303/215), so `inter-v3.woff2` (Inter 3.19 variable, OFL, via @fontsource/inter 4.5.15) replaces Inter 4. A/B over all gates: pages 98.36 → 99.25 % (27 → 30/31 pass), library 97.76 → 98.79 % (194 → 225/248); small text buttons +2 px wider (button 21 → 18/24) recorded as residual. | `fonts/roboto-slab.woff2`, `fonts/inter-v3.woff2`, `styles/fonts.css` |
| D2 | Page HTML from a project-authored generator plus hand-built pages | deploy's prototype → EDS conversion | A Figma-only site has no migrated static HTML to convert; content-model.json plus the Figma instance props and auto-layout tree are the source. | `stardust/.work/reskin/eds/build-content.mjs`, `content/*.plain.html` |
| D3 | `spec.mjs`, `asset.mjs` tooling | manual Figma inspection | Exact specs and assets per node for the builders (the M4 capture caches only kit canvases shallowly). | `stardust/.work/reskin/eds/` |
| D4 | AEM CLI fixes: repo `index.skipHash=false`, `index.version=2`; a preload that proxies ref `main` | — | isomorphic-git cannot read the manyFiles index; the worktree branch name exceeds the 63-character DNS label limit. Content is served from local `content/`, so the proxied ref does not affect output. | git config (shared repo), `stardust/.work/reskin/eds/aem-shortref.mjs` |
| D5 | Emails and overlays built as pages | — | They are frames in FULL PAGES; built with dedicated templates (`email`, `overlay`). | `styles/templates/` |
| D6 | One block per kit canvas | `content-rules.json kit.blockPer: "set"` | One block per component canvas, with component sets and states as variant classes, keeps the library author-sized. | `blocks/` |
| D8 | Gate references at frame bounds | M4 `renders` default image bounds | Figma's default render bounds include overflow, so 768/375 frames exported 780–970/400–416 px wide and failed on width with matching pixels. Fixed in the skill (`4e0637e1`): page frames and `Breakpoint=…` variants render with `use_absolute_bounds`. Not a deviation from the skill any more; recorded because earlier gate numbers in the log predate it. | `figma/renders.mjs` |
| D7 | Exactness bar uncalibrated | — | 3 % pixel and ±8 px height (pages) / ±2 px (variants) are the M4 defaults; the font stand-in (D1) adds a known residual on every heading. | `figma-gate exact|library` |

## Named assumptions
- Tablet breakpoint = 768 frames; desktop ≥ 1200; mobile < 768 (Figma ships 1440 / 768 / 375 frames only).
- Interactive states in the kit (hover, focus, pressed, disabled, error, open) are expressed as block variant classes for the library and as real CSS states on pages.
