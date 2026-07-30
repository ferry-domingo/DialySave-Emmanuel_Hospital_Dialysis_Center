import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import Topbar from "../../components/layout/Topbar";
import MonitoringPhic from "./MonitoringPhic";
import MonitoringCash from "./MonitoringCash";
import MonitoringDialyzer from "./MonitoringDialyzer";
import MonitoringPackage from "./MonitoringPackage";
import MonitoringAgreement from "./MonitoringAgreement";

import { usePatientStore } from "../../store/patientStore";
import { useMonitoringStore } from "../../store/monitoringStore";
import { useAuthStore } from "../../store/authStore";
import { normalizeRole, ROLES } from "../../utils/roles";

const TABS = [
  { key: "cash", label: "Cash Treatment" },
  { key: "phic", label: "PHIC Treatment" },
  { key: "dialyzer", label: "Dialyzer" },
  { key: "package", label: "Package" },
  { key: "agreement", label: "Agreement Form" },
];

const MonitoringPage = () => {

  const { patients, fetchPatients } = usePatientStore();
  const role = normalizeRole(useAuthStore((state) => state.user?.role));
  const isCashier = role === ROLES.CASHIER;
  const visibleTabs = isCashier ? TABS.filter((tab) => tab.key === "cash") : TABS;
  const [activeTab, setActiveTab] = useState(isCashier ? "cash" : "phic");

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

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {

    if (selectedPatient) {

      fetchMonitoring(selectedPatient);

    }

  }, [selectedPatient]);

  return (

    <div className="space-y-6">

      <Topbar title="Monitoring" />

      <div className="no-print space-y-4 rounded-3xl bg-white p-5 shadow-sm">

        <div className="relative inline-block">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2">
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
              className="w-64 bg-transparent text-sm font-semibold text-black outline-none placeholder:font-normal placeholder:text-slate-400"
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

        <div className="flex flex-wrap gap-2">

          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-slate-950 text-white shadow-md"
                  : "bg-slate-100 text-black hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}

        </div>

      </div>

      {

        loading && selectedPatient && (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Loading patient monitoring data...
          </div>
        )

      }

      {

        !loading && error && (
          <div className="rounded-3xl bg-red-50 p-5 text-sm font-medium text-red-600 shadow-sm">
            {error}
          </div>
        )

      }

      {

        !loading && monitoring &&

        <>
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
        </>

      }

    </div>

  )

}

export default MonitoringPage;
