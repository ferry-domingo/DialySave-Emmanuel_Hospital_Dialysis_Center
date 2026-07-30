import { useEffect, useMemo, useState } from "react";
import { CalendarDays, FlaskConical, HeartPulse, IdCard, Stethoscope } from "lucide-react";
import Topbar from "../../components/layout/Topbar";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";

const InfoTile = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 font-semibold text-slate-900">{value || "—"}</p>
  </div>
);

const StatTile = ({ icon: Icon, label, value }) => (
  <div className="rounded-3xl bg-white p-5 shadow-sm">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={16} />
      </span>
      {label}
    </div>
    <p className="mt-3 text-2xl font-extrabold text-slate-900">{value}</p>
  </div>
);

const doctorName = (doctor) => doctor
  ? `Dr. ${`${doctor.first_name || ""} ${doctor.last_name || ""}`.trim()}`
  : "Not assigned";

const PatientPortalPage = () => {
  const { user } = useAuthStore();
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        setLoading(true);
        const identifier =
          user?.patient?._id ||
          (typeof user?.patient === "string" ? user.patient : "") ||
          user?.loginId ||
          user?.id;
        const [patientRes, portalRes] = await Promise.all([
          api.get(`/patients/${identifier}`),
          api.get(`/patient-portal/${identifier}`),
        ]);

        const patient = patientRes.data.data;
        const data = portalRes.data.data;

        setPortalData({
          profile: {
            fullName: `${patient.first_name} ${patient.last_name}`.trim(),
            patientId: patient.patient_id,
            status: patient.status,
            doctorName: doctorName(patient.doctor),
            birthdate: patient.birthdate,
            bloodType: patient.blood_type,
          },
          summary: {
            sessionCount: data?.sessions?.length || 0,
            doctorName: doctorName(patient.doctor),
            status: patient.status,
          },
          sessions: data?.sessions || [],
          monitoring: data?.monitoring || null,
          admissionReport: data?.admissionReport || null,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your portal.");
      } finally {
        setLoading(false);
      }
    };

    const handleRealtimeUpdate = (event) => {
      if (["patients", "dialysis-sessions", "monitoring", "admission-report"].includes(event.detail?.resource)) {
        fetchPortal();
      }
    };

    if (user) fetchPortal();
    window.addEventListener("dialysave:data-changed", handleRealtimeUpdate);
    return () => window.removeEventListener("dialysave:data-changed", handleRealtimeUpdate);
  }, [user]);

  const latestSession = useMemo(() => {
    if (!portalData?.sessions?.length) return null;
    return [...portalData.sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }, [portalData]);

  return (
    <div className="space-y-6">

      <Topbar title="My Portal" />

      {loading && (
        <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          Loading your patient portal...
        </div>
      )}

      {error && (
        <div className="rounded-3xl bg-red-50 p-6 text-sm font-medium text-red-600 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile icon={IdCard} label="Patient ID" value={portalData?.profile?.patientId} />
            <StatTile icon={HeartPulse} label="Sessions" value={portalData?.summary?.sessionCount || 0} />
            <StatTile icon={Stethoscope} label="Primary Doctor" value={portalData?.profile?.doctorName} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Patient Details</h2>
                  <p className="mt-1 text-sm text-slate-500">Essential medical information and contact data.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                  {portalData?.profile?.status || "Active"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Full Name" value={portalData?.profile?.fullName} />
                <InfoTile label="Doctor" value={portalData?.profile?.doctorName} />
                <InfoTile
                  label="Birthdate"
                  value={portalData?.profile?.birthdate ? new Date(portalData.profile.birthdate).toLocaleDateString() : "—"}
                />
                <InfoTile label="Blood Type" value={portalData?.profile?.bloodType} />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Latest Session</h2>
                  <p className="mt-1 text-sm text-slate-500">Most recent dialysis treatment record.</p>
                </div>
              </div>

              {latestSession ? (
                <div className="mt-5 space-y-3">
                  <InfoTile label="Session ID" value={latestSession.session_id} />
                  <InfoTile label="Date" value={new Date(latestSession.createdAt).toLocaleDateString()} />
                  <div className="grid grid-cols-2 gap-3">
                    <InfoTile label="Payment" value={latestSession.payment_type || "N/A"} />
                    <InfoTile
                      label="Labs"
                      value={
                        latestSession.laboratory_results?.length
                          ? `${latestSession.laboratory_results.filter((result) => result.done).length}/${latestSession.laboratory_results.length} used`
                          : "No labs"
                      }
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">No sessions recorded yet.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <FlaskConical size={16} />
                </span>
                <h2 className="text-base font-bold text-slate-900">Monitoring Summary</h2>
              </div>

              <div className="mt-4 grid gap-3">
                <InfoTile label="PHIC Sessions" value={portalData.monitoring?.phic?.total || 0} />
                <InfoTile label="CASH Sessions" value={portalData.monitoring?.cash?.total || 0} />
                <InfoTile label="Dialyzer Sessions" value={portalData.monitoring?.dialyzer?.total || 0} />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <CalendarDays size={16} />
                </span>
                <h2 className="text-base font-bold text-slate-900">Admission Report</h2>
              </div>

              {portalData?.admissionReport ? (
                <div className="mt-4 grid gap-3">
                  <InfoTile label="Status" value={portalData.admissionReport.status} />
                  <InfoTile
                    label="Admission Date"
                    value={new Date(portalData.admissionReport.admission_date).toLocaleDateString()}
                  />
                  <InfoTile label="Dialysis Sessions" value={portalData.admissionReport.dialysis_sessions} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No admission report available.</p>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default PatientPortalPage;
