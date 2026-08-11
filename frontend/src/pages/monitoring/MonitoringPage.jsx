import { useEffect, useState } from "react";
import { Download, Printer, Search, X } from "lucide-react";

import Topbar from "../../components/layout/Topbar";
import MonitoringPhic from "./MonitoringPhic";
import MonitoringCash from "./MonitoringCash";
import MonitoringDialyzer from "./MonitoringDialyzer";
import MonitoringPackage from "./MonitoringPackage";
import MonitoringAgreement from "./MonitoringAgreement";

import { usePatientStore } from "../../store/patientStore";
import { useMonitoringStore } from "../../store/monitoringStore";

const TABS = [
  { key: "cash", label: "Cash Treatment" },
  { key: "phic", label: "PHIC Treatment" },
  { key: "dialyzer", label: "Dialyzer" },
  { key: "package", label: "Package" },
  { key: "agreement", label: "Agreement Form" },
];

const MonitoringPage = () => {

  const { patients, fetchPatients } = usePatientStore();
  const visibleTabs = TABS;
  const [activeTab, setActiveTab] = useState("phic");

  const {
    monitoring,
    loading,
    error,
    fetchMonitoring,
    clearMonitoring,
  } = useMonitoringStore();

  const [selectedPatient, setSelectedPatient] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  const selectedPatientObj = patients.find((p) => p._id === selectedPatient) || null;

  const filteredPatients = patients.filter((p) => {
    const term = patientSearch.trim().toLowerCase();
    if (!term) return true;
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(term) || p.patient_id?.toLowerCase().includes(term);
  });

  const handlePickPatient = (patient) => {
    setSelectedPatient(patient._id);
    setPatientSearch(`${patient.last_name}, ${patient.first_name}`);
    setPatientSearchOpen(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient("");
    setPatientSearch("");
    setPatientSearchOpen(false);
    clearMonitoring();
  };

  const handlePhicPrint = () => {
    const pageStyle = document.createElement("style");
    pageStyle.textContent = "@media print { @page { size: A4 landscape; margin: 0.4in; } }";
    document.head.appendChild(pageStyle);
    const cleanup = () => pageStyle.remove();
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  const handlePhicDownload = () => {
    const dates = monitoring?.phic?.dates || [];
    const rows = ["Session No.,Date", ...Array.from({ length: 156 }, (_, index) =>
      `${index + 1},${dates[index] ? new Date(dates[index]).toLocaleDateString() : ""}`
    )];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "phic-session-dates.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {

    if (selectedPatient) {

      fetchMonitoring(selectedPatient);

    }

  }, [selectedPatient]);

  return (

    <div className="min-w-0 space-y-2.5 xl:flex xl:h-full xl:flex-col xl:space-y-0 xl:overflow-hidden">

      <Topbar title="Monitoring" />

      <div className="no-print mt-2.5 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-2 shadow-sm">

        <div className="relative shrink-0">
          <div className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2">
            <Search size={15} className="shrink-0 text-slate-400" />
            <input
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setPatientSearchOpen(true);
              }}
              onFocus={() => setPatientSearchOpen(true)}
              onBlur={() => {
                setPatientSearchOpen(false);
                setPatientSearch(selectedPatientObj ? `${selectedPatientObj.last_name}, ${selectedPatientObj.first_name}` : "");
              }}
              placeholder="Search patient name or ID..."
              className="w-48 bg-transparent text-[10px] font-semibold text-black outline-none placeholder:font-normal placeholder:text-slate-400"
            />
            {selectedPatientObj && !patientSearchOpen && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClearPatient}
                aria-label="Clear selected patient"
                className="shrink-0 text-slate-400 transition hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {patientSearchOpen && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              className="absolute z-10 mt-1 max-h-64 w-72 overflow-y-auto rounded-2xl bg-white shadow-lg"
            >
              {filteredPatients.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">No matching patient.</p>
              ) : (
                filteredPatients.map((patient) => (
                  <button
                    key={patient._id}
                    type="button"
                    onClick={() => handlePickPatient(patient)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50"
                  >
                    <span className="font-semibold text-slate-900">{patient.last_name}, {patient.first_name}</span>
                    <span className="text-xs text-slate-400">{patient.patient_id}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">

          <div className="flex flex-wrap gap-1">

          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition ${
                activeTab === tab.key
                  ? "bg-slate-950 text-white shadow-md"
                  : "bg-slate-100 text-black hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}

          </div>

          {activeTab === "phic" && monitoring?.phic && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={handlePhicPrint} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">
                <Printer size={14} /> Print
              </button>
              <button type="button" onClick={handlePhicDownload} className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50">
                <Download size={14} /> Download
              </button>
            </div>
          )}

        </div>

      </div>

      {

        loading && selectedPatient && (
          <div className="mt-2.5 grid min-h-0 flex-1 place-items-center rounded-xl bg-white p-5 text-center text-sm text-slate-500 shadow-sm">
            Loading patient monitoring data...
          </div>
        )

      }

      {

        !loading && error && (
          <div className="mt-2.5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 shadow-sm">
            {error}
          </div>
        )

      }

      {

        !loading && monitoring &&

        <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto">
          {activeTab === "phic" && (
            <MonitoringPhic phic={monitoring.phic} />
          )}

          {activeTab === "cash" && (
            <MonitoringCash cash={monitoring.cash} />
          )}

          {activeTab === "dialyzer" && (
            <MonitoringDialyzer dialyzer={monitoring.dialyzer} />
          )}

          {activeTab === "package" && (
            <MonitoringPackage package={monitoring.package} />
          )}

          {activeTab === "agreement" && (
            <MonitoringAgreement
              key={selectedPatient}
              agreement={monitoring.agreement}
              patientId={selectedPatient}
            />
          )}
        </div>

      }

    </div>

  )

}

export default MonitoringPage;
