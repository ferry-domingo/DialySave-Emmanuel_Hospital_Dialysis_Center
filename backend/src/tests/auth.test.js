import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthToken,
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from "../utils/auth.js";

test("creates a token and verifies a hashed password", async () => {
  const payload = { id: "123", role: "Admin" };
  const token = createAuthToken(payload);

  assert.ok(token);
  assert.match(token, /^ey/);

  const hashed = await hashPassword("secret123");
  const isValid = await verifyPassword("secret123", hashed);

  assert.equal(isValid, true);
});

test("generates the expected temporary password for patients", () => {
  const password = generateTemporaryPassword("Dela Cruz", "1990-05-12");

  assert.equal(password, "Delacruz05121990");
});
