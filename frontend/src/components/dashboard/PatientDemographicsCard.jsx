import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ageOf = (birthdate) => {
  const born = new Date(birthdate);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) age -= 1;
  return Math.max(0, age);
};

const PatientDemographicsCard = ({ patients = [], loading }) => {
  const sexData = [
    { name: "Male", value: patients.filter((patient) => patient.gender === "Male").length, color: "#116149" },
    { name: "Female", value: patients.filter((patient) => patient.gender === "Female").length, color: "#6ee7b7" },
  ];
  const ageGroups = [
    { name: "0–17", min: 0, max: 17 },
    { name: "18–30", min: 18, max: 30 },
    { name: "31–45", min: 31, max: 45 },
    { name: "46–60", min: 46, max: 60 },
    { name: "61–75", min: 61, max: 75 },
    { name: "75+", min: 76, max: Infinity },
  ].map((group) => ({ ...group, patients: patients.filter((patient) => { const age = ageOf(patient.birthdate); return age !== null && age >= group.min && age <= group.max; }).length }));
  const hasSexData = sexData.some((item) => item.value > 0);

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm" aria-label="Patient demographics">
      <div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">Patient Demographics</h2><p className="mt-0.5 text-[9px] text-slate-400">Sex and age distribution of registered patients</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">{patients.length} patients</span></div>
      {loading ? <div className="grid flex-1 place-items-center text-xs text-slate-400">Loading demographics...</div> : <div className="mt-2 grid min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[38%_62%]">
        <div className="flex min-h-0 flex-col"><p className="text-[10px] font-semibold text-slate-600">Sex Distribution</p><div className="min-h-24 flex-1"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={hasSexData ? sexData : [{ name: "No data", value: 1, color: "#e2e8f0" }]} dataKey="value" innerRadius="38%" outerRadius="68%" stroke="none">{(hasSexData ? sexData : [{ color: "#e2e8f0" }]).map((item, index) => <Cell key={index} fill={item.color} />)}</Pie>{hasSexData && <Tooltip />}</PieChart></ResponsiveContainer></div><div className="flex justify-center gap-3">{sexData.map((item) => <span key={item.name} className="flex items-center gap-1 text-[9px] text-slate-500"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name} <b className="text-slate-800">{item.value}</b></span>)}</div></div>
        <div className="flex min-h-0 flex-col"><p className="text-[10px] font-semibold text-slate-600">Age Distribution</p><div className="min-h-28 flex-1"><ResponsiveContainer width="100%" height="100%"><BarChart data={ageGroups} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}><CartesianGrid vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#64748b" }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#94a3b8" }} /><Tooltip /><Bar dataKey="patients" name="Patients" fill="#116149" radius={[4, 4, 0, 0]} maxBarSize={26} /></BarChart></ResponsiveContainer></div></div>
      </div>}
    </section>
  );
};

export default PatientDemographicsCard;
