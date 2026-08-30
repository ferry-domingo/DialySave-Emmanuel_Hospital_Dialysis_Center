import test from "node:test";
import assert from "node:assert/strict";
import { getRealtimeDescriptor } from "../middleware/realtimeMiddleware.js";

test("maps a session mutation to dependent resources", () => {
  const result = getRealtimeDescriptor({ method: "PATCH", path: "/api/dialysis-sessions/abc/agreement/sign" });
  assert.equal(result.source, "dialysis-sessions");
  assert.equal(result.entityId, "abc");
  assert.ok(result.resources.includes("monitoring"));
  assert.ok(result.resources.includes("patient-portal"));
});

test("does not broadcast package preview or message mutations", () => {
  assert.equal(getRealtimeDescriptor({ method: "POST", path: "/api/monitoring/abc/package-import/preview" }), null);
  assert.equal(getRealtimeDescriptor({ method: "POST", path: "/api/messages/conversations/abc/messages" }), null);
});

test("maps authenticated profile mutations", () => {
  const result = getRealtimeDescriptor({ method: "PATCH", path: "/api/auth/me" });
  assert.deepEqual(result.resources, ["profile", "users", "online-directory"]);
});
