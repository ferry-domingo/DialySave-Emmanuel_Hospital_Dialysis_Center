import test from "node:test";
import assert from "node:assert/strict";
import {
  createAuthToken,
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from "../utils/auth.js";
import { formatDoctorId } from "../utils/generateDoctorId.js";

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

test("generates doctor login passwords from surname and birthday", () => {
  assert.equal(generateTemporaryPassword("Santos", "1985-10-23"), "Santos10231985");
  assert.equal(generateTemporaryPassword("Dela Cruz", "1974-01-09"), "Delacruz01091974");
});

test("formats automatic doctor IDs with a yearly sequence", () => {
  assert.equal(formatDoctorId(2026, 1), "DOC-2026-0001");
  assert.equal(formatDoctorId(2026, 42), "DOC-2026-0042");
});
