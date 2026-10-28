import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseIconRequest, parseStatusChange, requestStatus } from "../../../apps/web/src/lib/icon-requests.ts";
import { bearerToken, isAdmin, newToken, parseEmail } from "../../../apps/web/src/lib/api-keys.ts";

const valid = { name: "Basketball-Hoop", description: "A hoop with net, shown next to the score", keywords: ["NBA", "score"] };

describe("parseIconRequest", () => {
  it("normalizes a valid request", () => {
    assert.deepEqual(parseIconRequest(valid), { name: "basketball-hoop", description: valid.description, keywords: ["nba", "score"] });
    assert.deepEqual(parseIconRequest({ ...valid, keywords: undefined }).keywords, []);
  });

  it("rejects bad names, descriptions and keywords", () => {
    assert.throws(() => parseIconRequest(null), /name/);
    assert.throws(() => parseIconRequest({ ...valid, name: "hoop icon" }), /name/);
    assert.throws(() => parseIconRequest({ ...valid, description: "hoop" }), /description/);
    assert.throws(() => parseIconRequest({ ...valid, keywords: "nba" }), /keywords/);
    assert.throws(() => parseIconRequest({ ...valid, keywords: ["  "] }), /keywords/);
  });
});

describe("parseStatusChange", () => {
  it("accepts stored statuses and keeps a reason only for declined", () => {
    assert.deepEqual(parseStatusChange({ status: "declined", reason: " already  exists " }), { status: "declined", reason: "already exists" });
    assert.deepEqual(parseStatusChange({ status: "in-progress", reason: "x" }), { status: "in-progress", reason: null });
  });

  it("rejects done and unknown statuses", () => {
    assert.throws(() => parseStatusChange({ status: "done" }), /status/);
    assert.throws(() => parseStatusChange(null), /status/);
  });
});

describe("requestStatus", () => {
  const row = { id: 42, name: "basketball-hoop", status: "open" as const, decline_reason: null, created_at: "2026-10-28T10:00:00Z" };
  const base = { id: 42, name: "basketball-hoop", createdAt: "2026-10-28T10:00:00.000Z" };

  it("reports done from the published manifest, skipping deprecated aliases", () => {
    const published = [
      { id: "hoop", since: "0.2.0", request: 42, deprecated: true as const },
      { id: "basketball-hoop", since: "0.2.0", request: 42 },
    ];
    const done = { ...base, status: "done", icon: "basketball-hoop", version: "0.2.0" };
    assert.deepEqual(requestStatus(row, published), done);
    assert.deepEqual(requestStatus({ ...row, status: "declined" }, published), done);
  });

  it("reports the stored status when the icon is not published", () => {
    assert.deepEqual(requestStatus(row, []), { ...base, status: "open" });
    assert.deepEqual(requestStatus({ ...row, status: "in-progress" }, []), { ...base, status: "in-progress" });
    assert.deepEqual(requestStatus({ ...row, status: "declined", decline_reason: "exists as hoop" }, []),
      { ...base, status: "declined", reason: "exists as hoop" });
  });
});

describe("api keys", () => {
  const withAuth = (value: string) => new Request("https://x.test", { headers: { authorization: value } });

  it("reads only well-formed bearer tokens", () => {
    const token = newToken();
    assert.equal(bearerToken(withAuth(`Bearer ${token}`)), token);
    assert.equal(bearerToken(withAuth(token)), null);
    assert.equal(bearerToken(withAuth("Bearer vl_short")), null);
    assert.equal(bearerToken(new Request("https://x.test")), null);
  });

  it("checks the admin token from the environment", () => {
    process.env.ADMIN_TOKEN = "secret-admin";
    assert.equal(isAdmin(withAuth("Bearer secret-admin")), true);
    assert.equal(isAdmin(withAuth("Bearer secret")), false);
    delete process.env.ADMIN_TOKEN;
    assert.equal(isAdmin(withAuth("Bearer secret-admin")), false);
  });

  it("validates emails", () => {
    assert.equal(parseEmail({ email: " Dev@Example.com " }), "dev@example.com");
    assert.throws(() => parseEmail({ email: "nope" }), /email/);
    assert.throws(() => parseEmail(null), /email/);
  });
});
