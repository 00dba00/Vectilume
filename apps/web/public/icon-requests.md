# Requesting a Vectilume icon

Vectilume (https://vectilume.dev) is a free MIT icon set: outline, duotone and solid on a
24 × 24 grid. When an icon you need is missing, request it through this API. Plain HTTP + JSON,
base URL `https://vectilume.dev`.

## 1. Check that the icon does not exist yet

Search the published manifest by `id`, `label` and `keywords`:
`https://unpkg.com/@vectilume/icons@latest/manifest.json`, or browse https://vectilume.dev.

## 2. Get a token (once per developer)

```
POST /api/keys
content-type: application/json

{"email": "you@example.com"}
→ 202 {"sent": true, "note": "We sent a confirmation link to that address. …"}
```

The email holds a link to https://vectilume.dev/request-icons?confirm=…; the person who owns
the address opens it within 15 minutes and the page shows the token. An AI assistant cannot finish
this step: ask the user to open the link and give you the token. Until email confirmation is
switched on, the answer is `201 {"token": "vl_…"}` straight away.

The token is shown once. Keep it, e.g. in an env variable `VECTILUME_TOKEN`. At most 3 confirmation
emails per hour per address or IP. A token from a confirmed email sees every request made with that
email, also with older tokens.

## 3. Request an icon

```
POST /api/requests
authorization: Bearer vl_…
content-type: application/json

{"name": "basketball-hoop",
 "description": "Hoop with net, shown next to the live score",
 "keywords": ["nba", "score"]}
→ 201 {"id": 42, "status": "open", "statusUrl": "https://vectilume.dev/api/requests/42"}
```

- `name`: kebab-case, lowercase letters, digits and hyphens, up to 40 characters.
- `description`: 10–500 characters: what the icon shows and where it is used.
- `keywords`: optional, up to 10 words, each up to 30 characters.
- One icon per request. At most 20 requests per hour per token.
- Generic symbols only: no logos, trademarks or likenesses of real people or teams.

## 4. Follow the status

```
GET /api/requests            → {"requests": [...]}   your requests (this token, or every token of its confirmed email), newest first
GET /api/requests/42         → one request
authorization: Bearer vl_…
```

| status | meaning |
|---|---|
| `open` | received, waiting to be accepted |
| `accepted` | accepted and queued to be drawn |
| `in-progress` | being drawn |
| `ready` | drawn and added, ships with the next npm release |
| `done` | in the latest `@vectilume/icons` / `@vectilume/react`; `icon` is the final name (may differ from the requested one), `version` the release |
| `declined` | not planned; `reason` may say why |

The email behind the token also gets a short plain-text email when a request is received, when it
is `accepted`, moves to `in-progress`, `ready` or `declined`, and when it ships on npm (with the version and the
import line), so polling is optional. To turn these emails off (or back on), with a token from a confirmed email:

```
PATCH /api/settings
authorization: Bearer vl_…

{"emails": false}
→ 200 {"email": "you@example.com", "emails": false}
```

`GET /api/settings` shows the current setting. Every email also has a stop link.

Then install: `npm install @vectilume/react` → `import { BasketballHoop } from "@vectilume/react"`
(id in PascalCase, plus `Duotone` / `Solid` for the other styles), or use the SVG files from
`@vectilume/icons/{outline,duotone,solid}/<id>.svg`.

## Errors

Every error is `{"error": "<message you can show>"}`: 400 invalid body, 401 missing or wrong token,
404 not your request or no such id, 429 rate limit (try again within the hour).
