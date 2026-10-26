# Migration log — One AZ v3.2 (Figma) → EDS

<!-- provenance: written by stardust:reskin (Figma-only, M4 branch figma-reskin-m4-on-m2-acc) for the user's
     request "migrate figma design One AZ v3.2 to EDS, build all pages from the components/template sections,
     measure fidelity, tokens, cost, time". Times are IST (+05:30). Append-only. -->

- **Source:** https://www.figma.com/design/rsZQmpVzuyn0KhCDA3WN60/One-AZ-v3.2 (file version 2413431205561424165)
- **Skill:** stardust reskin, branch `figma-reskin-m4-on-m2-acc` (`~/repos/adobe-skills-m4-on-m2`, PR adobe/skills#449 head)
- **Target:** this EDS project, branch `ssandal-adobe-figma-oneaz-migration`
- **Migration start:** 2026-10-26 14:04:07 IST

## Steps

| # | Time (IST) | Phase | Step | Command / action | Result |
|---|---|---|---|---|---|
| 1 | 14:04 | setup | Project hygiene | `.gitignore` stardust block + `.env`; `.hlxignore` lists `stardust/`; `stardust/.gitignore` | done |
| 2 | 14:06 | setup | Instruments | `npm i -D playwright pixelmatch pngjs`; reskin scripts copied to `stardust/scripts/` | done |
| 3 | 14:08 | setup | Figma access | token stored in `.env` (mode 600, untracked); MCP not used — Figma REST API only (user instruction) | done |
| 4 | 14:10 | evidence | Linked node + file | `GET /v1/files/:key/nodes?ids=6400:21997`, `GET /v1/files/:key?depth=2` → `nodes.json`, `file-d2.json` | 50 canvases |
| 5 | 14:13 | evidence | FULL PAGES sets | `GET nodes?ids=<pages canvases>&depth=2` → `fullpages-d2.json` | 3 page sets: Login & Registration (23), Emails (5), Overlays (3) |
| 6 | 14:17 | evidence | Page frames | `GET nodes?ids=<31 desktop frames>&depth=3` → `pages-d3.json` | 31 pages; instances of 9 kit sets |
| 7 | 14:19 | evidence | Kit homes | `GET /v1/files/:key?ids=<9 set ids>` → `ids-path.json` (`/component_sets` returns 0: nothing published) | every used set lives on a ❏ / ❖ canvas |
| 8 | 14:20 | gap analysis | M4 vs the ask | M4 `content` takes one frame; no file-wide page discovery; no binding of sections to kit blocks | gaps → M4 changes (steps 9–14) |
| 9 | 14:22 | M4 change | Page discovery | NEW `scripts/figma/pages.mjs`: canvas groups (markers + ❖/❏/↪ glyphs), page sets → pages × breakpoints, docs frames skipped | 31 pages, 3 skipped docs frames |
| 10 | 14:26 | M4 change | Section ↔ kit binding | `figma/content.mjs` `kit` arg: section = outermost kit instance (`section.kit`, `kit.unbound` / `kit.mixed` flags); `content-run.mjs` `kitResolver` | Login Landing: login + header + footer bound |
| 11 | 14:27 | M4 change | Mapping → blocks | `stream-render.mjs` emits `data-block` / `data-block-variant` / `data-kit-instance` from mapping slots | done |
| 12 | 14:28 | M4 change | Runner + CLI | NEW `figma/pages-run.mjs` (`runPages`, `runContentAll`, `mapping.seed.json`); `figma-donor.mjs pages`, `content --all [--only]` | done |
| 13 | 14:31 | M4 change | Tests | NEW `test/figma-pages.test.mjs` | 20/20 pass |
| 14 | 14:35 | M4 change | Full block library | user: every kit canvas is a block, used or not; pages use only what they instance → `kitLibrary` (one block per ❖/❏ canvas, public sets = variants, `.` sets = parts; `kit.blockPer: set` alternative), kit canvases fetched at depth 5 | 32 kit canvases → 32 blocks |
| 15 | ≈14:40 | M4 change | Tests + docs for the library | `figma-pages.test.mjs` 23/23, `figma-content.test.mjs` 26/26; SKILL.md Phase 2′ and content-model.md § Pages and the kit library; CLI `pages` prints library / used / library-only | done |
| 16 | ≈14:42 | requirement | Exact replica of Figma | user: pages migrate exactly as designed; block library formed accurately with all blocks → gap: B2 pixel is advisory and library-only blocks are never gated | M4 change (step 17) |
| 17 | 14:46 | M4 change | Exact-fidelity references + gates | `figma-donor.mjs renders` (Figma PNG of every page breakpoint frame and every variant of every kit block, with copy → `reskin/figma-renders.json`); `figma-gate.mjs exact` (page × breakpoint, blocking) and `library` (block × variant on `/library/<block>`, `data-kit-component`); `figma-exact.test.mjs` 5/5; gates.md § (f), SKILL.md Phase 2′ + 5 (f) | done |
| 18 | 14:53 | M4 commit | Skill branch committed | `figma-reskin-m4-on-m2-acc` @ `ea6c4085` (local, not pushed); suite: new tests pass, 2 env-only failures (`pngjs` not resolvable from the plugin tree) + 1 timeout in untouched `deployed-gate` | done |
| 19 | 14:47 | stardust | init + pages | `figma-donor init`, `pages` (47 s): 31 pages on 4 canvases (62 frames: desktop + responsive), 3 doc frames skipped; kit library 32 blocks, 9 used, 23 library-only | `reskin/figma-pages.json` |
| 20 | 14:57 | stardust | capture | 38 frames (6 foundation: font styles, font variables, colours, icons, logos, spacing + 32 kit canvases), 2 m 44 s, 49 files | `canon-source/` |
| 21 | 15:00 | stardust | curation rules → curate → stamp | rules from role candidates; 13/13 probe paths, 32 modules; Lexia → Roboto Slab stand-in (named assumption) | `donor-tokens.json`, `donor-modules.md` |
| 22 | 15:04 | stardust | content --all | 31 pages modelled, 0 failed, 116 open flags (3 min 24 s); chrome from `registration`; mapping seed with the 32-block library | `content-model/*`, `mapping.seed.json` |
| 23 | 15:09 | stardust | renders | `figma-donor renders`: 93 page frames (31 × desktop/tablet/mobile) + 248 variants of 32 kit blocks, 341 PNGs, 0 failed (4 min 34 s) | `figma-renders.json` |
| 24 | 15:12 | EDS | foundation | Inter + Roboto Slab (Lexia stand-in) webfonts; `styles.css` rewritten with One AZ tokens (colour, type scale, buttons, form controls, sections, page templates form/login/email/overlay/library); `scripts.js` applies section-metadata (`style` → classes, `kit-component` → `data-kit-component`) | `fonts/`, `styles/`, `scripts/scripts.js` |
| 25 | 15:13 | EDS | dev server | AEM CLI fixed: repo `index.skipHash=false`, `index.version=2` (isomorphic-git cannot read manyFiles indexes); branch name too long for a DNS label → local preload proxies `main` (content is served from `content/` anyway); `aem up --html-folder content --html-mount / --prefer-plain-html --port 3000` | `.work/reskin/eds/aem-shortref.mjs` |
| 26 | 15:13 | EDS | spec + asset tools | `spec.mjs` (exact Figma node specs) and `asset.mjs` (SVG/PNG/image-fill export) for the block builders | `.work/reskin/eds/` |
| 27 | 15:20 | EDS | icons + template CSS | 15 Figma icons + checkbox tick exported as SVG from their master components; per-template stylesheets (`styles/templates/<template>.css`, loaded from `template` metadata); `kit-width` section metadata for library sections | `icons/`, `styles/templates/`, `scripts/scripts.js` |
| 28 | 15:20 | EDS | parallel build dispatched | 7 builder agents from one shared brief (`.work/reskin/eds/BRIEF.md`): A chrome (header Full/Registration, footer, nav fragments), B 23 form pages + block-content + generator, C login-landing + 5 emails + 2 overlays (login/email/modal blocks), G button/input/checkbox-radio library, D/E/F the 23 library-only kit blocks; done = figma-gate exact (pages × 3 breakpoints) / library (248 variants) | `blocks/`, `content/` |
| 29 | 15:23 | coordinator | speed directive | user asked to go faster: breadth first, max 3 fix→re-gate rounds per page/block, then the residual is recorded (bar unchanged) | builder reports |
| 30 | 15:20 | EDS | chrome done (A) | header Full + Registration (6 library variants PASS, 99.67 %), footer (3 PASS, 98.8 %); nav fragments `/nav`, `/nav-registration`, `/footer`; Full header 58 px below desktop (Figma crop) | `blocks/header`, `blocks/footer`, `content/nav*`, `content/footer` |
| 31 | 15:34 | EDS + M4 | controls done (G) + gate fix | button 21/24, input 32/32, checkbox-radio 5/8 (residuals: Inter text width, ring/helper anti-aliasing); **skill fix**: figma-gate flattens transparent Figma PNGs onto white before comparing (input was 0/32 raw) — M4 branch `f2c9f6e5`; G's global CSS (scoped button selectors, small type, radio dot, field help) applied | `blocks/button|input|checkbox-radio`, `styles.css` |
| 32 | 15:39 | EDS | library set E done | search-bar 2/2, slider 3/3, stepper 3/3, tab-nav 1/3 (Roboto Slab wider than Lexia), tabs 4/4, tables 20/20, toggle 5/8 (Inter anti-aliasing), tooltip 4/4 → 42/47 variants; interactive smoke clean; tokens `--az-grey-150`, `--az-magenta-100` added | `blocks/<8>`, `content/library/<8>` |
| 33 | 15:40 | EDS | library set D done | accordion 2/6 (95.4 %), back-to-top 6/6, breadcrumb 3/9 (92.2 %), carousel 1/3, chips 3/6, dropdown 10/10, links 3/5, pagination 14/22 = 42/67; residuals: Roboto Slab width, Inter anti-aliasing. Finding: page `metadata` must be its own final section | `report-D.md` |
| 34 | 15:42 | EDS + M4 | auth/email/overlay set C done + gate fix 2 | 6/8 pages PASS (98.2–99.3 %), login-landing / new-user mobile fail on 400-wide Figma frames + AA; library modal 6/6, email 2/2, login 4/6. Skill fix: `exact` viewport = Figma frame height (`0b34632b`, gates.md § (f) `7683bd4d`); `body.overlay` #666 | `report-C.md` |
| 35 | 15:44 | EDS | library set F done | quiz 6/6, account 2/3, forms 1/3, calculator 3/9, teaser 9/17, home-hero-branded 0/3 (96.2 %), cta-banner 1/3 = 22/44; most failures are oversized Figma PNGs (width) or Lexia stand-in wraps | `report-F.md` |
| 36 | 15:45 | M4 | skill fix 3: frame bounds | `renders` asks `use_absolute_bounds` for page frames and `Breakpoint=…` variants (26/248 variants + 10 page frames had PNGs 12–202 px wider than the frame); component variants keep render bounds (menus, tooltips, shadows). `4e0637e1`, test 5/5. Re-render of framed refs started | `figma-renders.json` |
| 37 | 15:47 | EDS | form pages done (B) | 23 form pages + `block-content` block + `form` template + generator `build-content.mjs`; 15/23 PASS at all 3 breakpoints, all 46 desktop/tablet runs PASS; 7 mobile failures from over-wide Figma PNGs (400/416 px), email-verified (Inter wrap), waiting-confirmation 3.22 %; block-content library 95.04 % | `report-B.md` |
| 38 | 15:49 | stardust | re-render framed refs | `renders` with fix 3: 178 PNGs in 5 calls; all 93 page frames now 1440/768/375, 0 framed-variant size mismatches. Smoke page removed. Full gate run (31 pages × 3, 32 blocks) started | `figma-renders.json` |
| 39 | 15:53 | EDS | baseline gate run (frame-bounds refs) | pages 27/31 PASS (98.36 %), library 194/248 (97.76 %); reset-link-expired: generator-emitted `height-desktop: 420` on the last section removed (+24 px) → PASS | `gate-baseline` |
| 40 | 15:59 | EDS | font A/B → adopted | Inter 3.19 (Figma's build, measured on ink widths) + width-matched Roboto Slab `size-adjust` 95.8/98.9 %: pages **30/31 PASS, 99.25 %**; library **225/248, 98.79 %**. Residual: small text buttons +2 px; new-user-registretion mobile 3.43 % (Arial AA in email body). Static Inter 3 instances tested: identical → variable file kept | D1 |

## Named assumptions

- **Block granularity:** one EDS block per kit canvas (20 ❖ components + 12 ❏ templates = 32). The user was asked and
  was unavailable; this matches the file's own organisation and the user's "24 unused + used" count. Per-set blocks remain
  available through `content-rules.json kit.blockPer: "set"`.
- **Emails and overlays** are built as pages (they are in FULL PAGES).
- **Exactness bar:** "exactly as in Figma" is gated as a blocking pixel bar per page and per block variant against
  Figma's own PNG render at the frame's width (desktop 1440, mobile frame width), plus the B1 geometry and B3 type gates;
  the residual (font rasterisation, anti-aliasing) is reported, not hidden.
