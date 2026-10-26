# Journal — One AZ v3.2 (Figma-only) → EDS

<!-- provenance: stardust:reskin M4 (branch figma-reskin-m4-on-m2-acc). Step-by-step record: migration-log.md.
     Numbers: reskin/fidelity-report.json. Deviations: direction.md D1–D8. -->

## Outcome

| | Result |
|---|---|
| Pages | 31 built (23 form, 5 email, 3 overlay), 3 breakpoints each = 93 frames |
| Pages, live preview | **30/31 pages, 92/93 frames PASS, 99.24 % similarity** (desktop 99.67, tablet 99.08, mobile 98.96) |
| Block library | **32/32 kit blocks** built (all kit canvases, used or not), 248 variants; **225/248 PASS, 98.79 %** |
| DA | 31 page docs + nav, nav-registration, footer + 32 `library/*` docs + 9 media, all previewed |
| Preview | `https://oneaz-pages--stardust-m4-test--sanyasandal.aem.page/<slug>` and `/library/<block>` |

Similarity is `100 − mismatch %` from `figma-gate`. It compares against Figma's own PNG render of the frame at its width
(1440 / 768 / 375), flattened onto white. The pass bar was never lowered: 3 % pixels and ±8 px height for pages,
±2 px for variants.

## Differences

- **Typography.** Lexia (the heading font) is licensed and not available as a webfont.
  - Roboto Slab stands in, width-matched with `size-adjust` 95.8 / 98.9 % (D1).
  - Inter 3.19 matches Figma's own build.
  - Residual: slab glyph shapes differ, so headings sit at about 1–3 % pixel drift. This causes most library fails (teaser, tab-nav, chips, links, breadcrumb, home-hero-branded) and the +2 px width on small text buttons.
- **Layout.** Geometry matches to ±1 px on all passing frames. Every page height is within ±8 px.
  - new-user-registretion, mobile: the email body uses Arial, and its anti-aliasing gives 3.43 % (fail). The layout is identical.
- **Colour.** Tokens come from Figma variables (`donor-tokens.json` → `styles/styles.css`). No colour residuals were found.
  - The back-to-top "dark" variant is white on white in Figma itself, and is reproduced as designed.
- **Components.**
  - Nav dropdowns are empty in Figma, so they are empty in EDS.
  - Calculator formulas are not implemented; only the layout is.
  - Quiz has the single question the kit shows.
  - Accordion, button, checkbox-radio and teaser have state variants (hover, focus, pressed) that fail only on font drift.

## Block formation

- **One block per kit canvas** (D6), with component sets and states as variant classes. Authors get 32 blocks, not one per state.
- **Pages reuse library blocks.** The 23 form pages share `block-content` plus the `form` template. Emails and overlays use the `email` and `overlay` templates (D5).
- **Content model.** Built from Figma instance props and the auto-layout tree (D2), because a Figma-only site has no static HTML to convert.
- **Defensive decoration.**
  - The DA/helix pipeline unwraps a lone `<p>` in a block cell, trims spaces around icons, and leaves an empty `<div>` where section-metadata was.
  - This cost 3rd-party-login 5 points on the live site (94.07 %).
  - `normalizeContent()` in `scripts/scripts.js` fixes this for every block. This is a finding for the skill too: gate the published preview, not only local HTML.

## Skill gaps fixed (M4 branch, unpushed: `ea6c4085` `f2c9f6e5` `0b34632b` `7683bd4d` `4e0637e1`)

- **Full kit.** Every kit canvas becomes a block, used on a page or not. Before this, the 24 unused canvases were reported as "unused kit" and skipped.
- **Discovery.** Multi-page kit discovery; mobile frames are paired with their desktop page as a breakpoint, not counted as a separate page.
- **Gate fidelity.**
  - Flatten PNGs onto white.
  - Size the viewport to the Figma frame.
  - Use frame-bounds renders instead of overflow bounds (D8).

## Environment notes

- The repo's git config was changed to `index.skipHash=false` and `index.version=2`, because the AEM CLI's isomorphic-git cannot read the manyFiles index (D4).
- The worktree branch name is longer than the 63-character DNS label limit. Code was also pushed to `oneaz-pages` for previews.
- Push needs the `sanyasandal` account; `ssandal_adobe` gets 403.
- Rotate the Figma personal access token used for this run.
