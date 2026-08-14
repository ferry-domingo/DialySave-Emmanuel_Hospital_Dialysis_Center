import { useEffect, useState } from "react";
import { Filter, KeyRound, Plus, Search, Settings } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../../components/layout/Topbar";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { useUserStore } from "../../store/userStore";
import Pagination from "../../components/common/Pagination";
import Select from "../../components/common/Select";

const PAGE_SIZE = 15;
const EMPTY_USER = {
  name: "",
  email: "",
  role: "Philhealth Officer",
  password: "",
  confirmPassword: "",
};
const ROLE_OPTIONS = [
  { value: "Philhealth Officer", label: "Philhealth Officer" },
  { value: "Cashier", label: "Cashier" },
  { value: "Admin", label: "Admin" },
];

const STATUS_STYLES = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-red-100 text-red-700",
};

const userName = (user) => user.role === "Patient"
  ? [user.patient?.first_name, user.patient?.last_name].filter(Boolean).join(" ") || user.name || user.username
  : user.name || user.username;

const loginId = (user) =>
  user.role === "Patient" ? user.patient?.patient_id || user.username : user.email || user.username;

const UsersPage = () => {
  const { users, loading, fetchUsers, createUser, updatePassword } = useUserStore();
  const updateUser = useUserStore((state) => state.updateUser);
  const [passwordUser, setPasswordUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  const term = search.trim().toLowerCase();
  const availableRoles = [...new Set(users.map((user) => user.role).filter(Boolean))].sort();
  const filteredUsers = users.filter((user) => {
    const createdDate = new Date(user.createdAt);
    const searchableValues = [
      userName(user), loginId(user), user.role, user.status,
      Number.isNaN(createdDate.getTime()) ? "" : createdDate.toLocaleDateString(),
      Number.isNaN(createdDate.getTime()) ? "" : createdDate.toLocaleString(),
      user.name, user.username, user.email,
      user.patient?.patient_id, user.patient?.first_name, user.patient?.middle_name,
      user.patient?.last_name, user.doctor?.doctor_id, user.doctor?.first_name,
      user.doctor?.middle_name, user.doctor?.last_name,
    ];
    const matchesFilter = (roleFilter === "all" || user.role === roleFilter) &&
      (statusFilter === "all" || user.status === statusFilter);
    return matchesFilter &&
      searchableValues.some((value) => String(value || "").toLowerCase().includes(term));
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const beginEdit = (user) => setEditUser({
    _id: user._id,
    name: userName(user),
    login: loginId(user),
    role: user.role,
    status: user.status,
  });

  const submitEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateUser(editUser._id, editUser);
      toast.success("User account updated successfully.");
      setEditUser(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update user.");
    } finally {
      setSaving(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    setSaving(true);
    try {
      await updatePassword(passwordUser._id, password);
      toast.success(`Password updated for ${userName(passwordUser)}.`);
      setPasswordUser(null);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  const submitUser = async (event) => {
    event.preventDefault();
    if (newUser.password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (newUser.password !== newUser.confirmPassword) return toast.error("Passwords do not match.");
    setSaving(true);
    try {
      await createUser({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password,
      });
      toast.success(`${newUser.name} was created successfully.`);
      setCreateOpen(false);
      setNewUser(EMPTY_USER);
      setPage(1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create user.");
    } finally {
      setSaving(false);
    }
  };

  const updateNewUser = (field) => (event) => {
    setNewUser((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <div className="space-y-2.5">
      <Topbar title="Users" />
      <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-white p-2 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 sm:w-64 sm:max-w-full">
            <Search size={16} className="text-slate-400" />
            <input placeholder="Search any table detail..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full bg-transparent text-[10px] text-black outline-none placeholder:text-slate-400" />
          </div>
          <details className="group relative sm:w-48">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-[11px] font-semibold text-slate-700 [&::-webkit-details-marker]:hidden"><Filter size={15} className="shrink-0 text-slate-400" /><span className="truncate">Filter users</span></summary>
            <div className="absolute left-0 top-full z-30 mt-1.5 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              <p className="mb-1 text-[9px] font-bold uppercase text-slate-400">Role</p>
              <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }} className="mb-2 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 outline-none" aria-label="Filter users by role"><option value="all">All roles</option>{availableRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select>
              <fieldset>
                <legend className="mb-1 text-[9px] font-bold uppercase text-slate-400">Status</legend>
                {[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }].map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[10px] text-slate-700 hover:bg-slate-50"><input type="radio" name="user-status-filter" value={option.value} checked={statusFilter === option.value} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="accent-emerald-600" />{option.label}</label>)}
              </fieldset>
            </div>
          </details>
        </div>
        <Button onClick={() => { setNewUser(EMPTY_USER); setCreateOpen(true); }} className="inline-flex items-center justify-center gap-1.5 !px-3 !py-1.5 !text-[11px]">
          <Plus size={15} /> Create User
        </Button>
      </div>
      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[620px] text-left text-[10px] [&_td]:!px-2.5 [&_td]:!py-1 [&_th]:!px-2.5 [&_th]:!py-1.5">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-700">
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Login</th><th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading users...</td></tr>}
            {!loading && filteredUsers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No users found.</td></tr>}
            {paginatedUsers.map((user) => (
              <tr key={user._id} className="transition hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-black">{userName(user)}</td>
                <td className="px-4 py-3 text-slate-500">{loginId(user)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">{user.role}</span></td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${STATUS_STYLES[user.status] || "bg-slate-100 text-slate-600"}`}>{user.status}</span></td>
                <td className="px-4 py-3 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => beginEdit(user)} title="User settings" aria-label={`Edit ${userName(user)}`} className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"><Settings size={13} /></button>
                    <button onClick={() => { setPasswordUser(user); setPassword(""); setConfirmPassword(""); }} className="inline-flex h-6 items-center gap-1 rounded-md border border-slate-200 px-2 text-[9px] font-bold hover:bg-slate-100"><KeyRound size={11} /> Password</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={currentPage} totalItems={filteredUsers.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <Modal isOpen={Boolean(editUser)} title="Edit User" onClose={() => !saving && setEditUser(null)}>
        {editUser && <form onSubmit={submitEdit} className="space-y-4">
          <Input label="Full name" required value={editUser.name} onChange={(event) => setEditUser((current) => ({ ...current, name: event.target.value }))} />
          <Input label="Login" required value={editUser.login} onChange={(event) => setEditUser((current) => ({ ...current, login: event.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Role" required value={editUser.role} onChange={(event) => setEditUser((current) => ({ ...current, role: event.target.value }))} options={[...ROLE_OPTIONS, { value: "Patient", label: "Patient" }, { value: "Doctor", label: "Doctor" }]} />
            <Select label="Status" required value={editUser.status} onChange={(event) => setEditUser((current) => ({ ...current, status: event.target.value }))} options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setEditUser(null)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button></div>
        </form>}
      </Modal>

      <Modal isOpen={createOpen} title="Create User" onClose={() => !saving && setCreateOpen(false)}>
        <form onSubmit={submitUser} className="space-y-4">
          <Input label="Full name" required value={newUser.name} onChange={updateNewUser("name")} autoComplete="name" />
          <Input label="Email" type="email" required value={newUser.email} onChange={updateNewUser("email")} autoComplete="email" />
          <Select label="Role" required value={newUser.role} onChange={updateNewUser("role")} options={ROLE_OPTIONS} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Password" type="password" required minLength={8} value={newUser.password} onChange={updateNewUser("password")} autoComplete="new-password" />
            <Input label="Confirm password" type="password" required minLength={8} value={newUser.confirmPassword} onChange={updateNewUser("confirmPassword")} autoComplete="new-password" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create user"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(passwordUser)} title={`Change password — ${passwordUser ? userName(passwordUser) : ""}`} onClose={() => !saving && setPasswordUser(null)}>
        <form onSubmit={submitPassword} className="space-y-4">
          <p className="text-sm text-slate-500">Set a new password with at least 8 characters.</p>
          <Input label="New password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <Input label="Confirm password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPasswordUser(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Update password"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
