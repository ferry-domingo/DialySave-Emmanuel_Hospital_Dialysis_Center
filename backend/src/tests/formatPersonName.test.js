import test from "node:test";
import assert from "node:assert/strict";
import { formatPersonName } from "../utils/formatPersonName.js";

test("formats uppercase and mixed-case names", () => {
  assert.equal(formatPersonName("JUAN DELA CRUZ"), "Juan Dela Cruz");
  assert.equal(formatPersonName("mArIa sANtos"), "Maria Santos");
});

test("normalizes spaces and compound names", () => {
  assert.equal(formatPersonName("  ANA   MARIE  "), "Ana Marie");
  assert.equal(formatPersonName("O'NEILL-SMITH"), "O'Neill-Smith");
});

test("keeps optional non-string values unchanged", () => {
  assert.equal(formatPersonName(undefined), undefined);
  assert.equal(formatPersonName(null), null);
});
