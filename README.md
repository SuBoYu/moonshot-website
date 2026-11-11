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
