import { useEffect, useState } from "react";
import { Mail, Phone, Save } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Topbar from "../../components/layout/Topbar";

const ContactManagementPage = ({ embedded = false }) => {
  const [form, setForm] = useState({ email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/site-contact").then(({ data }) => setForm(data.data)).catch(() => toast.error("Could not load contact information.")).finally(() => setLoading(false)); }, []);
  const save = async (event) => { event.preventDefault(); setSaving(true); try { const { data } = await api.put("/site-contact", form); setForm(data.data); toast.success(data.message); } catch (error) { toast.error(error.response?.data?.message || "Could not update contact information."); } finally { setSaving(false); } };
  const editor = <section id="contact-information" className={`${embedded ? "settings-card rounded-3xl" : "max-w-3xl rounded-xl"} border border-slate-200 bg-white p-5 shadow-sm`}><div className="mb-5"><h2 className="text-lg font-extrabold text-slate-900">Public contact details</h2><p className="mt-1 text-xs text-slate-500">These details appear on the public Contact page and footer.</p></div>{loading ? <p className="py-10 text-center text-sm text-slate-400">Loading contact information...</p> : <form onSubmit={save} className="space-y-4"><label className="block text-xs font-bold text-slate-700"><span className="mb-1.5 flex items-center gap-2"><Mail size={15}/>Email support</span><input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600"/></label><label className="block text-xs font-bold text-slate-700"><span className="mb-1.5 flex items-center gap-2"><Phone size={15}/>Contact number</span><input type="tel" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600"/></label><div className="flex justify-end border-t border-slate-100 pt-4"><button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"><Save size={15}/>{saving ? "Saving..." : "Save contact details"}</button></div></form>}</section>;
  if (embedded) return editor;
  return <div className="min-w-0 space-y-3"><Topbar title="Contact Information"/>{editor}</div>;
};
export default ContactManagementPage;
