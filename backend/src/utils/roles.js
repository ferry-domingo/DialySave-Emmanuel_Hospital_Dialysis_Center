export const ROLES = {
  ADMIN: "Admin",
  PHILHEALTH_OFFICER: "Philhealth Officer",
  LEGACY_PHIC_STAFF: "PHIC Staff",
  CASHIER: "Cashier",
  PATIENT: "Patient",
  DOCTOR: "Doctor",
};

export const normalizeRole = (role) =>
  role === ROLES.LEGACY_PHIC_STAFF ? ROLES.PHILHEALTH_OFFICER : role;
