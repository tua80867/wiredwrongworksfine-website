# Website development and deployment

## Repository and source

Repository: `tua80867/wiredwrongworksfine-website` (public).

`public/` contains the deployable static website. The root HTML files preserve the recovered November 8 baseline; edit the files inside `public/` for future changes. Documentation and private local configuration must not be deployed as website assets.

## Routine changes

1. Start a descriptive branch from the latest `main`, for example `site/channel-branding`.
2. Make the change in `public/` and preview locally: `py -m http.server 8000 --directory public`.
3. Verify desktop and mobile layout, navigation, images, and the privacy/terms links. Keep the private analytics utility description accurate.
4. Commit and open a pull request against `main` describing the change and validation.
5. Review the Cloudflare preview deployment when Git integration is configured.
6. Merge the reviewed change into `main` to publish automatically.
7. Verify the production URL, `/privacy.html`, and `/terms.html` after deployment.

Do not claim a preview or deployment exists until Cloudflare confirms it. Do not put Google OAuth secrets, tokens, private analytics exports, or credentials in this repository. The Apps Script analytics workflow remains separate.

## Cloudflare Workers configuration

The November 8 dashboard confirms the live site is a static-assets Worker named `dawn-mode-4443`, with zero bindings and a manual dashboard deployment. Keep this Worker and its existing custom domain. The repository's `wrangler.jsonc` targets that exact Worker and uploads only `public/`.

- GitHub repository: `tua80867/wiredwrongworksfine-website`
- Production branch: `main`
- Build command: blank (plain static HTML; no build needed)
- Deploy command: `npx wrangler deploy`
- Root directory: repository root (`/`)
- Asset directory: `public`, declared in `wrangler.jsonc`
- Preview branches: enable for development branches
- Custom domain: preserve `wiredwrongworksfine.com`

These settings are prepared, not yet applied. In the existing Worker's Settings > Builds, connect GitHub and select this repository. Authorize Cloudflare for this repository when requested. Confirm the production branch and commands above. Native Git integration supports connecting an existing Worker; no Pages migration is needed.

After connection, trigger and verify a baseline deployment before making branding changes. Preserve the current domain configuration; this file deliberately does not declare new routes or domains.

Official references:
- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

## Rollback

Use Cloudflare's prior successful production deployment for an immediate rollback when available. Then revert the responsible GitHub commit through a pull request so `main` matches the desired site; otherwise the next automatic deployment can restore the unwanted change.

## First planned feature branch: channel branding

Use the actual channel logo and banner, with locally stored assets under `public/assets/`. The screenshot establishes a warm cream background, dark navy typography, orange/yellow accents, a circuit/lightbulb logo, and the line “Ideas → Design → Build.” Recover the original artwork rather than recreating it from the screenshot. Build a responsive site frame with YouTube, maker projects, Snap Circuits, about, and footer policy links; do not present unfinished catalog features as working tools.
