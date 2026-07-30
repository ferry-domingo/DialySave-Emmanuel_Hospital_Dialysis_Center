export const getAgreementChecklist = (session) => {
  if (!session) {
    return [
      { key: "info", label: "Additional Information", done: false },
      { key: "acknowledgement", label: "Agreement Acknowledged", done: false },
      { key: "items", label: "Items Covered by PhilHealth", done: false },
      { key: "signatures", label: "Signatures", done: false },
    ];
  }

  const acknowledgement = session.agreement?.acknowledgement;
  const signatures = session.agreement?.signatures;

  return [
    {
      key: "info",
      label: "Additional Information",
      done: Boolean(session.sessionNo && session.date && session.patient && session.payment_type),
    },
    {
      key: "acknowledgement",
      label: "Agreement Acknowledged",
      // Missing/legacy records default to acknowledged (true), matching AgreementAcknowledgement's display.
      done: (acknowledgement?.informedConsent ?? true) && (acknowledgement?.itemsAcknowledged ?? true),
    },
    {
      key: "items",
      label: "Items Covered by PhilHealth",
      done: Boolean(session.injection?.name || session.iron?.name || session.dialyzer?.name || session.laboratories?.length),
    },
    {
      key: "signatures",
      label: "Signatures",
      done: Boolean(signatures?.patient?.signedAt && signatures?.witness?.signedAt && signatures?.facilityRepresentative?.signedAt),
    },
  ];
};

export const getAgreementCompletion = (session) => {
  const checklist = getAgreementChecklist(session);
  const completed = checklist.filter((item) => item.done).length;

  return Math.round((completed / checklist.length) * 100);
};
