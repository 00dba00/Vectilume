# Changelog

## v0.7.0 (2026-10-29)

- Requests: new requests are accepted by the owner before they are drawn, with a new accepted status and email
- Requests: turn request emails off on the page, by the link in every email or with PATCH /api/settings
- Admin: review drawn icons with Approve or Request changes, and see how many icons wait for the npm release
- Tooling: pnpm request sync/start/review keeps Codex's icon-queue folder and statuses up to date

## v0.6.0 (2026-10-29)

- Requests: email when your request is received, moves to in progress, ready or declined, and when it ships on npm with the import line
- Site: vectilume.dev is the main address, www and vectilume.vercel.app redirect to it
- Admin: button to email shipped requests right after an npm release

## v0.5.0 (2026-10-28)

- Requests: confirm your email by a link to get a token, and see every request you made with that email
- Requests: tokens are sent only to the owner of the address once email is switched on

## v0.4.0 (2026-10-28)

- Requests: request an icon and follow its status right on /request-icons
- Requests: the admin token lists every request with its email

## v0.3.3 (2026-10-28)

- Requests: up to 20 icon requests per hour per token (was 5)

## v0.3.2 (2026-10-28)

- Catalog: five new icons from requests: model-training, linear-scale, scroll-quill, auto-mode, new-badge

## v0.3.1 (2026-10-28)

- Docs: /request-icons guide for requesting icons, linked from the home page
- Docs: icon-requests.md, the same guide as Markdown for AI assistants

## v0.3.0 (2026-10-28)

- Admin: /admin shows token usage, all icon requests and lets you change their status
- Requests: new ready status for icons drawn and waiting for the npm release

## v0.2.0 (2026-10-28)

- Requests: icon requests use developer tokens instead of GitHub issues
- Requests: list and follow all your requests with one token

