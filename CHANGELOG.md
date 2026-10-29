# Changelog

## v0.9.1 (2026-10-29)

- Admin: Release to npm starts the GitHub workflow (its file could not be read)
- a failed start shows a message instead of an error page

## v0.9.0 (2026-10-29)

- Admin: release both npm packages with one button
- GitHub publishes only approved icons and tells developers in the next update email
- Catalog: eight new icons from requests (shield-plus, mail-open, devices, chart-search, list-clear, widgets, cart-plus, restart) and redrawn model-training and scroll-quill
- Admin: activity chart and counters for requests and tokens
- Tooling: pnpm request review commits and pushes the drawn icon before it goes to review

## v0.8.0 (2026-10-29)

- Requests: developers get at most one email a day with what changed on all their requests, instead of one email per change
- Admin: send the update emails right away after a batch of work, without a second email the next morning

## v0.7.1 (2026-10-29)

- Admin: notes for Codex keep every letter
- Admin: duotone previews show both colours

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

