<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## Icon requests (Codex)

Icons that developers requested are drawn from a queue the owner fills by accepting requests in /admin.

1. `pnpm request sync` refreshes `icon-queue/`: one Markdown file per accepted request (name, description, keywords and,
   when the owner sent it back, **Changes asked by the owner**). Only work on requests that have a file there.
2. Before drawing: `pnpm request start <id>`.
3. Draw the icon in all three styles under `packages/icons-svg/src/{outline,duotone,solid}/<id>.svg`, add its entry to the
   right collection JSON with `"request": <request id>`, and run `pnpm validate`.
4. When done: `pnpm request review <id>`. It commits only that icon (its three SVGs and the collection file) as
   `Icons: #<id> <icon> for review`, pushes to main, sends the SVGs to the owner and removes the queue file. Work on
   one request at a time, so the collection file holds no half-done entry of another icon. Changes asked by the owner:
   fix them and run `review` again (a new commit).
5. Always end your answer with what the script printed for each request (e.g. `#42 basketball-hoop: in-progress → review`).

Never publish to npm or change statuses any other way. The owner approves drawn icons in /admin and starts the npm
release from there (GitHub Actions); icons not approved yet are left out of the package even though they are on main.
The script needs `VECTILUME_WORKER_TOKEN` in `.env.worker` at the repo root; if it is missing, stop and say so.
