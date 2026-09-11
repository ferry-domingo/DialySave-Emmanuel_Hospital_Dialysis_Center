import assert from "node:assert/strict";
import test from "node:test";

import { buildBulkAgreementSessions, getDoctorAgreementBulk } from "../controllers/monitoringController.js";

const patient = (id, lastName) => ({
  _id: id,
  patient_id: `PAT-${id}`,
  first_name: "Test",
  middle_name: "",
  last_name: lastName,
});

const session = (id, patientId, day) => ({
  _id: id,
  patient: patientId,
  createdAt: new Date(`2026-01-${String(day).padStart(2, "0")}T00:00:00.000Z`),
  payment_type: "PHIC",
  injections: { name: "Epoetin" },
  intravenous_iron: { name: "Iron" },
  dialyzer: { name: "High Flux" },
  laboratory_request: [],
  agreement: {},
});

test("bulk agreements are grouped by patient and retain requested session numbers", () => {
  const patients = [patient("a", "Alpha"), patient("b", "Beta")];
  const sessions = [
    session("a1", "a", 1), session("a2", "a", 2), session("a3", "a", 3),
    session("b1", "b", 1), session("b2", "b", 2), session("b3", "b", 3),
  ];

  const result = buildBulkAgreementSessions(patients, sessions, 2, 3);

  assert.deepEqual(result.printableSessions.map(({ sessionId, sessionNo }) => [sessionId, sessionNo]), [
    ["a2", 2], ["a3", 3], ["b2", 2], ["b3", 3],
  ]);
  assert.equal(result.patientsWithSessions, 2);
  assert.equal(result.patientsWithoutSessions, 0);
});

test("bulk agreements print available sessions and count patients with no matching range", () => {
  const patients = [patient("a", "Alpha"), patient("b", "Beta"), patient("c", "Gamma")];
  const sessions = [session("a1", "a", 1), session("a2", "a", 2), session("b1", "b", 1)];

  const result = buildBulkAgreementSessions(patients, sessions, 2, 20);

  assert.deepEqual(result.printableSessions.map(({ sessionId, sessionNo }) => [sessionId, sessionNo]), [["a2", 2]]);
  assert.equal(result.patientsWithSessions, 1);
  assert.equal(result.patientsWithoutSessions, 2);
});

const responseRecorder = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("bulk agreement endpoint rejects an invalid doctor id", async () => {
  const response = responseRecorder();
  await getDoctorAgreementBulk({ query: { doctorId: "invalid", startSession: "1", endSession: "20" } }, response);
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
});

test("bulk agreement endpoint rejects reversed and oversized ranges", async () => {
  const validDoctorId = "507f1f77bcf86cd799439011";
  for (const [startSession, endSession] of [["20", "1"], ["1", "1001"]]) {
    const response = responseRecorder();
    await getDoctorAgreementBulk({ query: { doctorId: validDoctorId, startSession, endSession } }, response);
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.success, false);
  }
});
