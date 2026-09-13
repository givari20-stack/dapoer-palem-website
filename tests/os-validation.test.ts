import assert from "node:assert/strict";
import test from "node:test";

import { validateOsValues } from "../src/lib/os/validation.ts";

const userId = "11111111-1111-4111-8111-111111111111";

test("normalizes a project and its unique team membership", () => {
  const result = validateOsValues("projects", {
    name: "Website",
    objective: "",
    description: "",
    owner_id: userId,
    team: [userId, userId],
    priority: "high",
    start_date: "2026-09-13",
    deadline: "2026-10-01",
    status: "active",
    tags: "website, launch",
    notes: "",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.values.team, [userId]);
    assert.deepEqual(result.values.tags, ["website", "launch"]);
  }
});

test("rejects invalid relations and unsupported workflow states", () => {
  const relation = validateOsValues("tasks", { title: "Task", project_id: "not-a-uuid", priority: "medium", status: "todo" });
  const status = validateOsValues("campaigns", { campaign_name: "Campaign", status: "invented" });
  assert.equal(relation.ok, false);
  assert.equal(status.ok, false);
});

test("does not accept unknown fields into persisted OS values", () => {
  const result = validateOsValues("roadmap", { title: "Next", horizon: "next", display_order: 1, active: true, created_by: userId });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(Object.hasOwn(result.values, "created_by"), false);
});
