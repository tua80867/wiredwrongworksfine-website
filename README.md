# Wired Wrong, Works Fine

Existing public website recovered from https://wiredwrongworksfine.com/ on November 8, 2026.

## Baseline

- `index.html`: brand introduction and private YouTube Data Utility description.
- `privacy.html`: existing privacy policy, dated October 27, 2026.
- `terms.html`: existing terms, dated October 27, 2026.

These are the HTML responses served by the live site, including the Cloudflare Insights beacon. They are a recovered public baseline, not a recovered hosting configuration or original repository. No page content has been changed.

## Existing analytics workflow

The site provides public information and policy pages for the owner's private Google OAuth / YouTube analytics utility. Earlier project chats describe Google Apps Script retrieving the owner's YouTube metrics into private Google Sheets. That Apps Script code, OAuth configuration, and spreadsheet are separate from these static pages and have not been recovered here. Never put OAuth tokens or client secrets in public HTML.

## Local preview

The deployable site is in `public/`. The root HTML files are the unchanged recovered baseline. From this directory, with Python installed:

```powershell
py -m http.server 8000 --directory public
```

Open http://localhost:8000. Serving the directory preserves the site's root-relative links.

## Development direction from project history

- Expand the WWWF maker-project website.
- Proposed public feature: searchable Snap Circuits parts catalog and kit inventories.
- Verify catalog records against source manuals and kit editions; distinguish partial and unknown inventories.
- Eventually share catalog data with the Windows Explorer prototype and a possible Android app.
- Preserve the privacy and terms URLs and the private analytics utility description while expanding the site.

## Deployment still to locate

GitHub is verified as connected to `tua80867`. The public repository is `tua80867/wiredwrongworksfine-website`. Cloudflare project configuration is still to inspect. No production changes have been made.

See [WORKFLOW.md](WORKFLOW.md) for the prepared branch, preview, production, and rollback process.
