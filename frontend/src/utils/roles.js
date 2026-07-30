export const ROLES = {
  ADMIN: "Admin",
  PHILHEALTH_OFFICER: "Philhealth Officer",
  LEGACY_PHIC_STAFF: "PHIC Staff",
  CASHIER: "Cashier",
  PATIENT: "Patient",
};

export const normalizeRole = (role) =>
  role === ROLES.LEGACY_PHIC_STAFF ? ROLES.PHILHEALTH_OFFICER : role;

export const defaultPathForRole = (role) => {
  switch (normalizeRole(role)) {
    case ROLES.ADMIN:
      return "/users";
    case ROLES.PATIENT:
      return "/patient-portal";
    default:
      return "/";
  }
};
