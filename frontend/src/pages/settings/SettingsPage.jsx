import { useEffect, useState } from "react";
import { Camera, KeyRound, MailCheck, ShieldCheck, Trash2, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import Topbar from "../../components/layout/Topbar";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { useAuthStore } from "../../store/authStore";
import UserAvatar from "../../components/common/UserAvatar";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => { setName(user?.name || user?.username || ""); }, [user?.name, user?.username]);
  useEffect(() => { setEmail(user?.email || ""); }, [user?.email]);
  useEffect(() => { setProfilePicture(user?.profilePicture || ""); }, [user?.profilePicture]);

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
    if (user?.role !== "Patient" && name.trim().length < 2) return toast.error("Name must be at least 2 characters.");
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
    <div className="space-y-6">
      <Topbar title="Account Settings" />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <form onSubmit={saveProfile} className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600"><UserRound size={21} /></span>
            <div><h2 className="font-bold text-slate-900">Account details</h2><p className="text-sm text-slate-500">Manage your sign-in identity.</p></div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center">
              <UserAvatar user={{ ...user, profilePicture }} className="h-24 w-24 text-2xl" />
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
            {user?.role === "Patient" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Patient name</p><p className="mt-1 font-semibold text-slate-800">{user?.name || user?.username || "—"}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Login Patient ID</p><p className="mt-1 font-semibold text-slate-800">{user?.loginId || user?.patient?.patient_id || "—"}</p></div>
              </div>
            ) : (
              <>
                <Input label="Name" required value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
              </>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Role</p><p className="mt-1 font-semibold text-slate-800">{user?.role || "—"}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Status</p><p className="mt-1 font-semibold text-emerald-600">{user?.status || "—"}</p></div>
            </div>
            <Button type="submit" disabled={profileSaving || (name.trim() === (user?.name || user?.username || "") && profilePicture === (user?.profilePicture || ""))}>{profileSaving ? "Saving..." : "Save account details"}</Button>
          </div>
        </form>

        <div className="space-y-6">
        {user?.role !== "Patient" && (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><MailCheck size={21} /></span>
              <div><h2 className="font-bold text-slate-900">Login email</h2><p className="text-sm text-slate-500">A code will be sent to the new address before it becomes your login.</p></div>
            </div>
            <div className="space-y-4">
              <Input label="New email address" type="email" required value={email} maxLength={254} onChange={(event) => { setEmail(event.target.value); setPendingEmail(""); }} />
              {!pendingEmail ? (
                <Button type="button" onClick={sendVerification} disabled={emailSaving || email.trim() === (user?.email || "")}>{emailSaving ? "Sending..." : "Send verification code"}</Button>
              ) : (
                <>
                  <p className="text-sm text-slate-500">Enter the code sent to <span className="font-semibold text-slate-700">{pendingEmail}</span>.</p>
                  <Input label="6-digit verification code" inputMode="numeric" required value={verificationCode} maxLength={6} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))} />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={confirmEmail} disabled={emailSaving}>{emailSaving ? "Verifying..." : "Verify and change email"}</Button>
                    <Button type="button" variant="secondary" onClick={sendVerification} disabled={emailSaving}>Resend code</Button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        <form onSubmit={savePassword} className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><KeyRound size={21} /></span>
            <div><h2 className="font-bold text-slate-900">Change password</h2><p className="text-sm text-slate-500">Use at least eight characters.</p></div>
          </div>
          <div className="space-y-4">
            <Input label="Current password" type="password" required autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords((value) => ({ ...value, currentPassword: event.target.value }))} />
            <Input label="New password" type="password" required autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords((value) => ({ ...value, newPassword: event.target.value }))} />
            <Input label="Confirm new password" type="password" required autoComplete="new-password" value={passwords.confirmPassword} onChange={(event) => setPasswords((value) => ({ ...value, confirmPassword: event.target.value }))} />
            <Button type="submit" disabled={passwordSaving}>{passwordSaving ? "Changing..." : "Change password"}</Button>
          </div>
        </form>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
        <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={21} />
        <div><p className="font-bold text-emerald-900">Security activity is recorded</p><p className="mt-1 text-sm text-emerald-700">Profile updates, successful password changes, and failed password attempts appear in the administrator Activity Logs.</p></div>
      </div>
    </div>
  );
};

export default SettingsPage;
