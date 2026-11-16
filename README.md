# Moonshot 射月計畫

Official website source. GitHub is the source of truth; Cloudflare Pages Git integration is the deployment target, matching SuBoYu/tonysu's hosting approach. Cloudflare connection must be configured once in its dashboard; creating this repository does not establish that connection.

## Edit and preview

Edit `src/index.html` (Traditional Chinese copy, responsive CSS, inline brand illustration, platform links and mobile menu). No dependencies or installation required.

```sh
npm run build
npm run preview
```

Open http://localhost:4173. The build validates navigation targets, JavaScript syntax and required brand links before copying the site to `dist/`. Host monograms are brand illustrations, not portraits. No episodes, schedules or host biographies are invented.

## Cloudflare Pages settings

| Setting | Value |
| --- | --- |
| Integration | GitHub, SuBoYu/moonshot-website |
| Project name | moonshot-website (requested; subject to availability) |
| Production branch | main |
| Framework preset | None |
| Root directory | Repository root / leave blank |
| Build command | npm run build |
| Build output directory | dist |
| Node.js | 22 (NODE_VERSION environment variable if needed) |

Enable production branch builds and preview branch deployments. No Cloudflare API token or GitHub deployment secret is needed for this Git integration. GitHub Actions checks the source; Cloudflare runs its own build and deployment. A GitHub CI failure alone does not prevent Cloudflare deploying main: require the check in a branch rule if desired, and merge only passing PRs. Cloudflare's own build also runs the validation.

## Updates

Create a branch, edit, build, push and open a pull request. Check GitHub CI and Cloudflare preview before merging into main. After merge, confirm Cloudflare reports a successful production deployment.

## Deployment guide

See [docs/cloudflare-pages-guide.md](docs/cloudflare-pages-guide.md) for one-time setup, domains, verification, rollback and the reusable Tommy checklist.

The earlier Sites prototype remains separate and is not automatically synchronized. Use this repository for future official website changes. Do not copy the prior Sites `.openai/hosting.json` or private deployment credentials here.

## Latest episodes

The homepage combines the editorial moon cover with an upcoming rocket-episode feature and two published episode links. `src/data/episodes.json` is a reviewed snapshot of the official SoundOn RSS (resolved from Apple Podcasts show 1682741765). Episode title, date, duration and direct links are real feed metadata. It is not a live browser feed and does not update automatically.

Refresh deliberately with `npm run episodes:update` (Python 3 and network access required), review the JSON diff, then run `npm run build`. Normal builds need no network or third-party packages. The build renders the episode cards, escapes feed text and validates dates, ordering and official-player URLs. The upcoming plan lives separately in `src/data/upcoming.json`, is clearly marked as in preparation with dates unconfirmed, and has a channel subscription CTA instead of a play link. No unpublished plans are presented as released episodes.

## Pixel mission-control design variant

`/pixel/` is an independent dark pixel-art design direction. Edit `src/pixel.html` for the design; it shares reviewed upcoming/published episode data with the light homepage. The existing `/` homepage is preserved.

The original Moonshot art uses a midnight, mint and coral palette, pixel moon/rocket scenery, an original pixel moon mark, geometric crew avatars and native keyboard-accessible topic disclosures. Hero art is illustrative, not mission photography or a representation of a specific rocket. There are no SpaceX logos or borrowed Instagram assets.

The hero asset lives in `src/pixel-assets/pixel-moon.png` and is bundled locally. See `docs/pixel-art-direction.md` for provenance and the generation brief. Builds copy this asset into `dist/pixel/assets/`.

## Default homepage design

The selected pixel-space opening and spacious light editorial content now form the default homepage at `/`. Edit `src/index.html`; artwork is bundled at `/assets/pixel-moon.png`. The `/hybrid/` comparison page has been removed. `/pixel/` remains the earlier all-dark design comparison. No hidden game is included.

## SpaceX launch tracker

`/launches/` lists the next SpaceX launch (countdown, pad on a dot-matrix globe, launch sequence), upcoming and recent launches, and every Starship flight test. Edit `src/launches.html`; the homepage nav links to it. The design follows the homepage: warm-white navigation, a dark mission-control opening with mint countdown accents, then spacious warm-white lists and a pale sage Starship history section.

Data comes from [Launch Library 2](https://thespacedevs.com/llapi) (The Space Devs). `src/data/launches.json` is a checked-in snapshot, so builds need no network. Refresh it with `npm run launches:update` (three API requests; the free tier allows 15 per hour), review the diff, then build. In the browser the page also asks Launch Library for the latest ten upcoming and ten previous launches, at most once every 30 minutes per visitor, and keeps showing the snapshot if that request fails. This is the one place the site calls a third-party API from visitors' browsers. `scripts/launch-normalize.mjs` is shared by the snapshot script and the page (the build inlines it).

The page uses no photographs, SpaceX logos or web fonts. The globe is drawn from `src/data/land-mask.json`, a coarse land grid generated from Natural Earth (public domain) by `scripts/make-land-mask.mjs`; the Starship outline is an original schematic. Mission descriptions are shown in English as provided by the data source. The page states that it is unofficial and not affiliated with SpaceX.

## Light and dark appearance

The header's moon/sun button switches all pages between light and dark styles. The initial default is dark; an explicit preference is saved as `moonshot.theme` in local storage, restored before the first paint and synchronized across tabs. Navigation between the homepage, launch tracker and pixel comparison retains the same choice. The dark cinematic hero remains in both themes.

Shared behavior and styles live in `src/shared/theme.js` and `src/shared/theme.css`, copied to `/theme.js` and `/theme.css` during builds. The toggle continues working when storage is blocked. Run `npm test` for launch formatting/cache checks and theme persistence, accessibility state, blocked-storage and cross-tab checks.

## Brand naming

The umbrella website brand is **Moonshot 射月計畫**. Do not append PODCAST to its wordmark or describe the entire brand as a podcast. YouTube videos, podcast conversations and on-location exploration are formats under the broader brand. Keep Podcast labels where they identify an actual listening format or platform, and preserve existing platform URLs.

The homepage and launch tracker share `src/shared/header.html` and `src/shared/header.js`. Edit the shared template to change both top navigation bars; the build resolves homepage/launch links for each route. Launch-specific section links and the data status live inside the launch hero.


## Brand identity

The shared header, page-footer wordmark, favicon, touch icon and social preview use the Moonshot brand kit v1. `src/brand-assets/` contains outlined SVG lockups (no font download needed), pixel-crescent icons and a warm-paper stacked-ink 1200×630 share card. Light and dark logos switch with the saved theme; the first visit defaults to dark. Visible wordmarks use lowercase `moonshot`, while page titles and accessible names remain “Moonshot 射月計畫”.

Build metadata uses `https://moonshot-website-4b9.pages.dev` as the production origin. Set `SITE_URL` to the new HTTPS origin when a custom domain is adopted. The share card matches the warm social-account identity; its outlined SVG source is included as `src/brand-assets/social-card-warm.svg`. The same share-card design is used across pages with page-specific titles and descriptions. Production artwork is used directly; the AI application mockup is not shipped.
