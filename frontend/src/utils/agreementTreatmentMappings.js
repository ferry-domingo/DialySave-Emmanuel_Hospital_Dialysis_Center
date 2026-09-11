const normalize = (value) => String(value || "")
  .toLowerCase()
  .replace(/,/g, "")
  .replace(/\s+/g, " ")
  .trim();

const INJECTION_EQUIVALENTS = {
  epokine: "4000 iu / ml 1ml vial",
  eporife: "4000 iu / ml 1ml vial",
  recormon: "5000 iu / 0.3 ml pre-filled syringe",
};

const DIALYZER_EQUIVALENTS = {
  "nipro elisio 19h": "high flux",
  "amical dia 19h": "high flux",
};

const IRON_EQUIVALENTS = {
  encifer: "iron sucrose 20 mg/ml 5ml ampule",
};

export const agreementInjectionEquivalent = (value) =>
  INJECTION_EQUIVALENTS[normalize(value)] || normalize(value);

export const agreementDialyzerMatches = (savedValue, agreementValue) =>
  (DIALYZER_EQUIVALENTS[normalize(savedValue)] || normalize(savedValue)) === normalize(agreementValue);

export const agreementIronMatches = (savedValue) =>
  (IRON_EQUIVALENTS[normalize(savedValue)] || normalize(savedValue)) === normalize("Iron Sucrose 20 mg/mL, 5mL ampule");
