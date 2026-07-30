import test from "node:test";
import assert from "node:assert/strict";
import { buildPatientPortalData } from "../utils/patientView.js";

test("buildPatientPortalData returns a summary for the patient portal", () => {
  const patient = {
    first_name: "Ana",
    last_name: "Dela Cruz",
    status: "Active",
    doctor: {
      first_name: "Maria",
      last_name: "Santos",
    },
  };

  const sessions = [
    { session_id: "S-001", createdAt: "2026-01-01T00:00:00.000Z" },
    { session_id: "S-002", createdAt: "2026-02-01T00:00:00.000Z" },
  ];

  const result = buildPatientPortalData(patient, sessions);

  assert.equal(result.summary.sessionCount, 2);
  assert.equal(result.summary.doctorName, "Maria Santos");
  assert.equal(result.summary.status, "Active");
});

test("buildPatientPortalData preserves full dialysis session details", () => {
  const patient = {
    first_name: "Ana",
    last_name: "Dela Cruz",
    status: "Active",
  };

  const sessions = [
    {
      _id: "session-1",
      session_id: "S-001",
      createdAt: "2026-01-01T00:00:00.000Z",
      payment_type: "CASH",
      injections: { name: "EPO" },
      dialyzer: { name: "Low Flux" },
      intravenous_iron: { name: "Iron Sucrose" },
      laboratory_results: [{ name: "CBC", done: true }],
    },
  ];

  const result = buildPatientPortalData(patient, sessions);

  assert.equal(result.sessions[0].session_id, "S-001");
  assert.equal(result.sessions[0].payment_type, "CASH");
  assert.equal(result.sessions[0].injections.name, "EPO");
  assert.equal(result.sessions[0].dialyzer.name, "Low Flux");
  assert.equal(result.sessions[0].laboratory_results[0].name, "CBC");
});
