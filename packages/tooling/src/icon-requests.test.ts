import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { issueFor, parseIconRequest, requestStatus } from "../../../apps/web/src/lib/icon-requests.ts";

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
    assert.throws(() => parseIconRequest({ ...valid, keywords: ["<>"] }), /keywords/);
  });

  it("strips markup and mentions from the issue text", () => {
    const { body } = issueFor(parseIconRequest({ ...valid, description: "<img src=x> ping @someone `code`" }));
    assert.ok(!/[<>@`]/.test(body), body);
  });
});

describe("requestStatus", () => {
  const issue = { number: 42, html_url: "https://github.com/x/42", state: "open" as const, labels: [{ name: "icon-request" }] };
  const base = { id: 42, url: issue.html_url };

  it("hides issues that are not icon requests", () => {
    assert.equal(requestStatus({ ...issue, labels: ["bug"] }, []), null);
    assert.equal(requestStatus({ ...issue, pull_request: {} }, []), null);
  });

  it("reports done from the published manifest, skipping deprecated aliases", () => {
    const published = [
      { id: "hoop", since: "0.2.0", request: 42, deprecated: true as const },
      { id: "basketball-hoop", since: "0.2.0", request: 42 },
    ];
    assert.deepEqual(requestStatus({ ...issue, state: "closed", state_reason: "completed" }, published),
      { ...base, status: "done", icon: "basketball-hoop", version: "0.2.0" });
    assert.deepEqual(requestStatus(issue, published), { ...base, status: "done", icon: "basketball-hoop", version: "0.2.0" });
  });

  it("maps the issue state when the icon is not published", () => {
    assert.deepEqual(requestStatus(issue, []), { ...base, status: "open" });
    assert.deepEqual(requestStatus({ ...issue, labels: ["icon-request", "in-progress"] }, []), { ...base, status: "in-progress" });
    assert.deepEqual(requestStatus({ ...issue, state: "closed", state_reason: "completed" }, []), { ...base, status: "in-progress" });
    assert.deepEqual(requestStatus({ ...issue, state: "closed", state_reason: "not_planned" }, []), { ...base, status: "declined" });
  });
});
