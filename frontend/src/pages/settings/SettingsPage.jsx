import { useEffect, useState } from "react";
import { ArrowLeft, Camera, ChevronRight, ContactRound, Eye, EyeOff, KeyRound, MailCheck, ShieldCheck, Trash2, UserRound, HeartPulse } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../../components/layout/Topbar";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { useAuthStore } from "../../store/authStore";
import UserAvatar from "../../components/common/UserAvatar";
import { normalizeRole, ROLES } from "../../utils/roles";
import ContactManagementPage from "../contact/ContactManagementPage";
import api from "../../api/axios";
import { updatePatient } from "../../api/patientApi";

const prepareProfilePicture = (file) => new Promise((resolve, reject) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return reject(new Error("Choose a JPG, PNG, or WebP image."));
  if (file.size > 5 * 1024 * 1024) return reject(new Error("Choose an image smaller than 5 MB."));

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.onload = () => {
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    canvas.getContext("2d").drawImage(image, (image.naturalWidth - sourceSize) / 2, (image.naturalHeight - sourceSize) / 2, sourceSize, sourceSize, 0, 0, 512, 512);
    URL.revokeObjectURL(objectUrl);
    resolve(canvas.toDataURL("image/jpeg", 0.82));
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("That image could not be read."));
  };
  image.src = objectUrl;
});

const SettingsPage = () => {
  const { user, updateProfile, changePassword, requestEmailChange, verifyEmailChange } = useAuthStore();
  const role = normalizeRole(user?.role);
  const isAdmin = String(role || "").toLowerCase() === ROLES.ADMIN.toLowerCase();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, new: false, confirm: false });
  const [emailSaving, setEmailSaving] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [activeSection, setActiveSection] = useState("account");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientSaving, setPatientSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => { setName(user?.name || user?.username || ""); }, [user?.name, user?.username]);
  useEffect(() => { setEmail(user?.email || ""); }, [user?.email]);
  useEffect(() => { setProfilePicture(user?.profilePicture || ""); }, [user?.profilePicture]);
  const isPatient = normalizeRole(user?.role) === ROLES.PATIENT;
  const openSection = (section) => {
    setActiveSection(section);
    setMobileDetailOpen(true);
  };
  const passwordVisibilityButton = (field, label) => (
    <button type="button" onClick={() => setVisiblePasswords((value) => ({ ...value, [field]: !value[field] }))} aria-label={`${visiblePasswords[field] ? "Hide" : "Show"} ${label}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700">
      {visiblePasswords[field] ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  useEffect(() => {
    if (!isPatient) return;
    const identifier = user?.patient?._id || user?.patient?.patient_id || user?.loginId;
    if (!identifier) return;
    api.get(`/patients/${identifier}`).then(({ data }) => setPatientProfile(data.data)).catch(() => toast.error("Could not load medical profile."));
  }, [isPatient, user?.patient?._id, user?.patient?.patient_id, user?.loginId]);

  const selectPicture = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setProfilePicture(await prepareProfilePicture(file));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (![ROLES.PATIENT, ROLES.DOCTOR].includes(user?.role) && name.trim().length < 2) return toast.error("Name must be at least 2 characters.");
    setProfileSaving(true);
    try {
      const result = await updateProfile({ name: name.trim(), profilePicture });
      toast.success(result.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update account.");
    } finally {
      setProfileSaving(false);
    }
  };

  const savePatientProfile = async (event) => {
    event.preventDefault();
    setPatientSaving(true);
    try {
      const result = await updatePatient(patientProfile._id, {
        first_name: patientProfile.first_name,
        middle_name: patientProfile.middle_name,
        last_name: patientProfile.last_name,
        birthdate: patientProfile.birthdate,
        gender: patientProfile.gender,
        blood_type: patientProfile.blood_type,
        contact_number: patientProfile.contact_number,
      });
      setPatientProfile(result.data.data);
      toast.success("Medical profile updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update medical profile.");
    } finally {
      setPatientSaving(false);
    }
  };

  const sendVerification = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error("Enter a valid email address.");
    setEmailSaving(true);
    try {
      const result = await requestEmailChange(email.trim());
      setPendingEmail(result.pendingEmail);
      setVerificationCode("");
      toast.success(result.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send verification code.");
    } finally {
      setEmailSaving(false);
    }
  };

  const confirmEmail = async () => {
    if (!/^\d{6}$/.test(verificationCode)) return toast.error("Enter the 6-digit verification code.");
    setEmailSaving(true);
    try {
      const result = await verifyEmailChange(verificationCode);
      setPendingEmail("");
      setVerificationCode("");
      toast.success(result.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not verify email.");
    } finally {
      setEmailSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword.length < 8) return toast.error("New password must be at least 8 characters.");
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error("New passwords do not match.");
    setPasswordSaving(true);
    try {
      const result = await changePassword(passwords.currentPassword, passwords.newPassword);
      toast.success(result.message);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <Topbar title="Account Settings" />

      <div className="settings-facebook-shell">
        <aside className={`settings-facebook-nav ${mobileDetailOpen ? "settings-mobile-hidden" : ""}`}>
          <div className="settings-nav-heading"><h1>Settings</h1><p>Manage your account and preferences.</p></div>
          <nav aria-label="Settings sections">
            <button type="button" className={activeSection === "account" ? "active" : ""} onClick={() => openSection("account")}><span><UserRound size={20} /></span><div><strong>Account details</strong><small>Profile and account information</small></div><ChevronRight size={17} /></button>
            {isPatient && <button type="button" className={activeSection === "medical" ? "active" : ""} onClick={() => openSection("medical")}><span><HeartPulse size={20} /></span><div><strong>Medical profile</strong><small>Update your personal information</small></div><ChevronRight size={17} /></button>}
            <button type="button" className={activeSection === "email" ? "active" : ""} onClick={() => openSection("email")}><span><MailCheck size={20} /></span><div><strong>Login email</strong><small>Add, change, and verify your email</small></div><ChevronRight size={17} /></button>
            <button type="button" className={activeSection === "password" ? "active" : ""} onClick={() => openSection("password")}><span><KeyRound size={20} /></span><div><strong>Password & security</strong><small>Protect your account</small></div><ChevronRight size={17} /></button>
            {isAdmin && <button type="button" className={activeSection === "contact" ? "active" : ""} onClick={() => openSection("contact")}><span><ContactRound size={20} /></span><div><strong>Public contact</strong><small>Website contact details</small></div><ChevronRight size={17} /></button>}
          </nav>
          <div className="settings-nav-user"><UserAvatar user={user} className="h-11 w-11 text-sm" /><div><strong>{user?.name || user?.username || "User"}</strong><span>{user?.role || "Account"}</span></div></div>
        </aside>

        <main className={`settings-facebook-content settings-mobile-detail ${mobileDetailOpen ? "open" : ""}`}>
          <button type="button" className="settings-mobile-back" onClick={() => setMobileDetailOpen(false)} aria-label="Back to Settings"><ArrowLeft size={17} /> Back</button>
          <div className="settings-grid grid gap-6 xl:grid-cols-[1fr_1fr]">
            {activeSection === "account" && <form id="account-details" onSubmit={saveProfile} className="settings-card rounded-3xl bg-white p-6 shadow-sm">
              <div className="settings-card-header mb-6 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600"><UserRound size={21} /></span>
                <div><h2 className="font-bold text-slate-900">Account details</h2><p className="text-sm text-slate-500">Manage your sign-in identity.</p></div>
              </div>
              <div className="space-y-4">
                <div className="settings-profile-row flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center">
                  <UserAvatar user={{ ...user, profilePicture }} className="settings-avatar h-24 w-24 text-2xl" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Profile picture</p>
                    <p className="mb-3 text-sm text-slate-500">JPG, PNG, or WebP. Your photo will be cropped to a square.</p>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                        <Camera size={16} /> Choose photo
                        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPicture} />
                      </label>
                      {profilePicture && (
                        <button type="button" onClick={() => setProfilePicture("")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                          <Trash2 size={16} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {[ROLES.PATIENT, ROLES.DOCTOR].includes(user?.role) ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">{user.role} name</p><p className="mt-1 font-semibold text-slate-800">{user?.name || user?.username || "—"}</p></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Login {user.role} ID</p><p className="mt-1 font-semibold text-slate-800">{user?.loginId || user?.patient?.patient_id || user?.doctor?.doctor_id || "—"}</p></div>
                  </div>
                ) : (
                  <>
                    <Input containerClassName="settings-field" label="Name" required value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
                  </>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Role</p><p className="mt-1 font-semibold text-slate-800">{user?.role || "—"}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Status</p><p className="mt-1 font-semibold text-emerald-600">{user?.status || "—"}</p></div>
                </div>
                <Button type="submit" disabled={profileSaving || (name.trim() === (user?.name || user?.username || "") && profilePicture === (user?.profilePicture || ""))}>{profileSaving ? "Saving..." : "Save account details"}</Button>
              </div>
            </form>}

            {activeSection === "medical" && isPatient && patientProfile && <form id="medical-profile" onSubmit={savePatientProfile} className="settings-card rounded-3xl bg-white p-6 shadow-sm">
              <div className="settings-card-header mb-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><HeartPulse size={21} /></span><div><h2 className="font-bold text-slate-900">Medical profile</h2><p className="text-sm text-slate-500">Keep your patient information up to date.</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input containerClassName="settings-field" label="First name" required value={patientProfile.first_name || ""} onChange={(event) => setPatientProfile({ ...patientProfile, first_name: event.target.value })} />
                <Input containerClassName="settings-field" label="Middle name" value={patientProfile.middle_name || ""} onChange={(event) => setPatientProfile({ ...patientProfile, middle_name: event.target.value })} />
                <Input containerClassName="settings-field" label="Last name" required value={patientProfile.last_name || ""} onChange={(event) => setPatientProfile({ ...patientProfile, last_name: event.target.value })} />
                <Input containerClassName="settings-field" label="Birthdate" type="date" required value={patientProfile.birthdate ? new Date(patientProfile.birthdate).toISOString().slice(0, 10) : ""} onChange={(event) => setPatientProfile({ ...patientProfile, birthdate: event.target.value })} />
                <label className="settings-field"><span>Gender</span><select value={patientProfile.gender || ""} onChange={(event) => setPatientProfile({ ...patientProfile, gender: event.target.value })}><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option></select></label>
                <label className="settings-field"><span>Blood type</span><select value={patientProfile.blood_type || ""} onChange={(event) => setPatientProfile({ ...patientProfile, blood_type: event.target.value })}><option value="">Select blood type</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                <Input containerClassName="settings-field sm:col-span-2" label="Contact number" value={patientProfile.contact_number || ""} onChange={(event) => setPatientProfile({ ...patientProfile, contact_number: event.target.value })} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Patient ID</p><p className="mt-1 font-semibold text-slate-800">{patientProfile.patient_id}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Assigned doctor</p><p className="mt-1 font-semibold text-slate-800">{patientProfile.doctor ? `${patientProfile.doctor.first_name} ${patientProfile.doctor.last_name}` : "Not assigned"}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Status</p><p className="mt-1 font-semibold text-emerald-600">{patientProfile.status}</p></div></div>
              <Button type="submit" disabled={patientSaving}>{patientSaving ? "Saving..." : "Save medical profile"}</Button>
            </form>}

            <div className="settings-card-stack space-y-6">
              {activeSection === "email" && (
                <section id="login-email" className="settings-card rounded-3xl bg-white p-6 shadow-sm">
                  <div className="settings-card-header mb-6 flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><MailCheck size={21} /></span>
                    <div><h2 className="font-bold text-slate-900">Login email</h2><p className="text-sm text-slate-500">Add or change your email. A code will be sent before it can be used to sign in.</p></div>
                  </div>
                  <div className="space-y-4">
                    <Input containerClassName="settings-field" label="New email address" type="email" required value={email} maxLength={254} onChange={(event) => { setEmail(event.target.value); setPendingEmail(""); }} />
                    {!pendingEmail ? (
                      <Button type="button" onClick={sendVerification} disabled={emailSaving || email.trim() === (user?.email || "")}>{emailSaving ? "Sending..." : "Send verification code"}</Button>
                    ) : (
                      <>
                        <p className="text-sm text-slate-500">Enter the code sent to <span className="font-semibold text-slate-700">{pendingEmail}</span>.</p>
                        <Input containerClassName="settings-field" label="6-digit verification code" inputMode="numeric" required value={verificationCode} maxLength={6} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))} />
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" onClick={confirmEmail} disabled={emailSaving}>{emailSaving ? "Verifying..." : "Verify and change email"}</Button>
                          <Button type="button" variant="secondary" onClick={sendVerification} disabled={emailSaving}>Resend code</Button>
                        </div>
                      </>
                    )}
                  </div>
                </section>
              )}

              {activeSection === "password" && <form id="password-security" onSubmit={savePassword} className="settings-card rounded-3xl bg-white p-6 shadow-sm">
                <div className="settings-card-header mb-6 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><KeyRound size={21} /></span>
                  <div><h2 className="font-bold text-slate-900">Change password</h2><p className="text-sm text-slate-500">Use at least eight characters.</p></div>
                </div>
                <div className="space-y-4">
                  <Input containerClassName="settings-field" label="Current password" type={visiblePasswords.current ? "text" : "password"} endAdornment={passwordVisibilityButton("current", "current password")} required autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords((value) => ({ ...value, currentPassword: event.target.value }))} />
                  <Input containerClassName="settings-field" label="New password" type={visiblePasswords.new ? "text" : "password"} endAdornment={passwordVisibilityButton("new", "new password")} required autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords((value) => ({ ...value, newPassword: event.target.value }))} />
                  <Input containerClassName="settings-field" label="Confirm new password" type={visiblePasswords.confirm ? "text" : "password"} endAdornment={passwordVisibilityButton("confirm", "password confirmation")} required autoComplete="new-password" value={passwords.confirmPassword} onChange={(event) => setPasswords((value) => ({ ...value, confirmPassword: event.target.value }))} />
                  <Button type="submit" disabled={passwordSaving}>{passwordSaving ? "Changing..." : "Change password"}</Button>
                </div>
              </form>}
            </div>

            {activeSection === "contact" && isAdmin && <ContactManagementPage embedded />}
          </div>

          {activeSection === "password" && <div className="settings-notice flex items-start gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={21} />
            <div><p className="font-bold text-emerald-900">Security activity is recorded</p><p className="mt-1 text-sm text-emerald-700">Profile updates, successful password changes, and failed password attempts appear in the administrator Activity Logs.</p></div>
          </div>}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
