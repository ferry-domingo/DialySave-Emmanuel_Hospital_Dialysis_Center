const ROWS_PER_PAGE = 24;

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric" })
  : "";

const AdmissionReportPrintTable = ({ reports = [] }) => {
  const pageCount = Math.max(1, Math.ceil(reports.length / ROWS_PER_PAGE));
  const pages = Array.from({ length: pageCount }, (_, pageIndex) =>
    reports.slice(pageIndex * ROWS_PER_PAGE, (pageIndex + 1) * ROWS_PER_PAGE)
  );

  return (
    <div className="print-page admission-report-print bg-white text-black">
      {pages.map((pageReports, pageIndex) => (
        <section key={pageIndex} className="admission-report-print-page">
          <h1>DAILY ADMISSION REPORT</h1>
          <table>
            <colgroup>
              <col style={{ width: "3%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "19%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>No.</th>
                <th>Name of Patient</th>
                <th>Admission Date/s</th>
                <th>Discharged Date</th>
                <th># of Dialysis<br />Treatment</th>
                <th>Name of Hospital</th>
                <th>Info Relayed By<br />(Nurse)</th>
                <th>Info Relayed To<br />(PHIC Officer)</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS_PER_PAGE }, (_, rowIndex) => {
                const report = pageReports[rowIndex];
                return (
                  <tr key={rowIndex}>
                    <td>{pageIndex * ROWS_PER_PAGE + rowIndex + 1}</td>
                    <td className="patient-name">{report?.full_name || ""}</td>
                    <td>{formatDate(report?.admission_date)}</td>
                    <td>{formatDate(report?.discharge_date)}</td>
                    <td>{report ? report.dialysis_sessions : ""}</td>
                    <td>{report?.hospital || ""}</td>
                    <td>{report?.info_relayed?.nurse || ""}</td>
                    <td>{report?.info_relayed?.phic_staff || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
};

export default AdmissionReportPrintTable;
