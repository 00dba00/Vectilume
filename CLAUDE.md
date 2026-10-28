## Workflow (app-workflow skill)

Ovaj projekt koristi globalni `app-workflow` skill: roadmap prije implementacije, review queue za odgođene odluke, verzija samo kroz release.

- Roadmap: `apps/web/public/roadmap.json` · Review queue: `apps/web/public/review-queue.json` · Verzija: `version.json`
- Pregled: `/workflow.html`
- Provjera: `node "$HOME/.claude/skills/app-workflow/scripts/wf.mjs" check --public apps/web/public` (bez `--public` traži `public/` u rootu)
- Release: `node "$HOME/.claude/skills/app-workflow/scripts/wf.mjs" release <patch|minor|major> "Area: change; ..."`
- Deploy: Vercel automatski deploya web (`apps/web`) na push u `main`, pa `release` nema `--deploy`. `version.json` je verzija weba; npm paketi (`@vectilume/*`) imaju vlastite verzije kroz `packages/tooling` release.
