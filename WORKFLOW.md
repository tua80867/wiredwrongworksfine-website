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

## Proposed Cloudflare Pages configuration

- GitHub repository: `tua80867/wiredwrongworksfine-website`
- Production branch: `main`
- Framework preset: None
- Build command: blank (plain static HTML; no build needed)
- Build output directory: `public`
- Preview branches: enable for development branches
- Custom domain: preserve `wiredwrongworksfine.com`

These settings are prepared, not yet applied. Inspect the existing Cloudflare project before changing it.

If the current project uses Direct Upload, Cloudflare does not support converting it to native Git integration. Options are a new Git-integrated Pages project with a controlled domain cutover, or keeping the current project and deploying from GitHub Actions through Wrangler. Choose after inspecting the existing deployment. Do not delete the existing project or move the domain until the replacement deployment has been verified.

Official references:
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

## Rollback

Use Cloudflare's prior successful production deployment for an immediate rollback when available. Then revert the responsible GitHub commit through a pull request so `main` matches the desired site; otherwise the next automatic deployment can restore the unwanted change.

## First planned feature branch: channel branding

Use the actual channel logo and banner, with locally stored assets under `public/assets/`. The screenshot establishes a warm cream background, dark navy typography, orange/yellow accents, a circuit/lightbulb logo, and the line “Ideas → Design → Build.” Recover the original artwork rather than recreating it from the screenshot. Build a responsive site frame with YouTube, maker projects, Snap Circuits, about, and footer policy links; do not present unfinished catalog features as working tools.
