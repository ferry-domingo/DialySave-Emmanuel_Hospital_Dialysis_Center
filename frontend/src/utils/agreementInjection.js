const normalize = (value) => String(value || "")
  .toLowerCase()
  .replace(/,/g, "")
  .replace(/\s+/g, " ")
  .trim();

const LEGACY_EQUIVALENTS = {
  "pre-filled": "4000 iu / 0.4 ml pre-filled syringe",
  "vial": "4000 iu / ml 1ml vial",
  "4000 iu / ml solution for injection":
    "4000 iu / ml solution for injection in 1ml pre-filled syringe",
};

export const agreementInjectionMatches = (savedValue, agreementValue) => {
  const saved = normalize(savedValue);
  const expected = normalize(agreementValue);
  return saved === expected || LEGACY_EQUIVALENTS[saved] === expected;
};
