import User from "../models/User.js";
import crypto from "crypto";
import { createAuthToken, generateTemporaryPassword, hashPassword, verifyPassword } from "../utils/auth.js";
import { recordActivity } from "../utils/activityLog.js";
import { sendEmailVerificationCode } from "../utils/email.js";
import { normalizeRole, ROLES } from "../utils/roles.js";
import { Doctor } from "../models/Doctor.js";

const patientName = (patient) =>
  [patient?.first_name, patient?.middle_name, patient?.last_name].filter(Boolean).join(" ");
const doctorName = (doctor) =>
  [doctor?.first_name, doctor?.middle_name, doctor?.last_name].filter(Boolean).join(" ");

const publicUser = (user) => ({
  id: user._id,
  username: user.role === ROLES.PATIENT
    ? patientName(user.patient) || user.name || user.username
    : user.role === ROLES.DOCTOR
      ? doctorName(user.doctor) || user.name || user.username
      : user.name || user.username,
  name: user.role === ROLES.PATIENT
    ? patientName(user.patient) || user.name
    : user.role === ROLES.DOCTOR
      ? doctorName(user.doctor) || user.name
      : user.name,
  email: user.email || "",
  loginId: user.role === ROLES.PATIENT
    ? user.patient?.patient_id || user.username
    : user.role === ROLES.DOCTOR
      ? user.doctor?.doctor_id || user.username
      : user.email || user.username,
  role: normalizeRole(user.role),
  status: user.status,
  patient: user.patient,
  doctor: user.doctor,
  profilePicture: user.profilePicture,
  createdAt: user.createdAt,
});

export const loginUser = async (req, res) => {
  try {
    const { loginId: submittedLoginId, password } = req.body;
    const loginId = String(submittedLoginId || "").trim();
    const portalLoginId = /^(?:PAT|DOC)-/i.test(loginId) ? loginId.toUpperCase() : loginId;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, patient ID, or doctor ID and password are required.",
      });
    }

    let user = await User.findOne({
      $or: [
        { email: loginId.toLowerCase() },
        { username: portalLoginId, role: { $in: [ROLES.PATIENT, ROLES.DOCTOR] } },
      ],
    })
      .populate("patient", "patient_id first_name middle_name last_name")
      .populate("doctor", "doctor_id first_name middle_name last_name gender status");

    // Backfill portal accounts for doctors created before doctor login was introduced.
    if (!user) {
      const doctor = await Doctor.findOne({ doctor_id: portalLoginId });
      if (doctor) {
        const expectedPassword = generateTemporaryPassword(doctor.last_name, doctor.birthdate);
        if (password === expectedPassword) {
          user = await User.create({
            username: doctor.doctor_id,
            name: doctorName(doctor),
            password: await hashPassword(expectedPassword),
            role: ROLES.DOCTOR,
            doctor: doctor._id,
            status: doctor.status,
          });
          user.doctor = doctor;
        }
      }
    }

    if (user?.role === ROLES.DOCTOR) {
      let linkedDoctor = user.doctor;
      if (!linkedDoctor) {
        linkedDoctor = await Doctor.findOne({ doctor_id: user.username });
        if (linkedDoctor) {
          user.doctor = linkedDoctor._id;
          await user.save();
          user.doctor = linkedDoctor;
        }
      }
      if (linkedDoctor && user.status !== linkedDoctor.status) {
        user.status = linkedDoctor.status;
        await user.save();
      }
    }

    if (!user) {
      await recordActivity({
        req,
        actor: { username: loginId },
        action: "LOGIN_FAILED",
        details: "Login failed: account was not found.",
      });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    if (user.status !== "Active") {
      await recordActivity({
        req,
        actor: user,
        action: "LOGIN_BLOCKED",
        target: user,
        details: "Login blocked because the account is inactive.",
      });
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact an administrator.",
      });
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      await recordActivity({
        req,
        actor: user,
        action: "LOGIN_FAILED",
        target: user,
        details: "Login failed: incorrect password.",
      });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    if (user.role === ROLES.LEGACY_PHIC_STAFF) {
      user.role = ROLES.PHILHEALTH_OFFICER;
      await user.save();
    }

    const token = createAuthToken({
      id: user._id,
      username: user.username,
      role: user.role,
      patient: user.patient,
      doctor: user.doctor,
    });

    await recordActivity({ req, actor: user, action: "USER_LOGIN", target: user, details: "User signed in." });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: publicUser(req.user),
  });
};

export const logoutUser = async (req, res) => {
  await recordActivity({
    req,
    actor: req.user,
    action: "USER_LOGOUT",
    target: req.user,
    details: "User signed out.",
  });

  return res.status(200).json({
    success: true,
    message: "Logout recorded successfully.",
  });
};

export const updateMyProfile = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const profilePicture = req.body.profilePicture;
    if (req.user.role !== "Patient" && (name.length < 2 || name.length > 100)) {
      return res.status(400).json({
        success: false,
        message: "Name must contain between 2 and 100 characters.",
      });
    }

    if (
      profilePicture !== undefined &&
      profilePicture !== "" &&
      (typeof profilePicture !== "string" ||
        !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(profilePicture) ||
        profilePicture.length > 1_500_000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Profile picture must be a JPG, PNG, or WebP image under 1 MB.",
      });
    }

    const user = await User.findById(req.user._id)
      .populate("patient", "patient_id first_name middle_name last_name")
      .populate("doctor", "doctor_id first_name middle_name last_name gender status");
    if (![ROLES.PATIENT, ROLES.DOCTOR].includes(user.role)) {
      user.name = name;
    }
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    await user.save();

    await recordActivity({
      req,
      actor: user,
      action: "ACCOUNT_PROFILE_UPDATED",
      target: user,
      details: "Account profile was saved.",
    });

    return res.json({
      success: true,
      message: "Account details updated.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "That email is already in use." });
    }
    return res.status(500).json({ success: false, message: "Failed to update account details." });
  }
};

export const requestEmailChange = async (req, res) => {
  try {
    if ([ROLES.PATIENT, ROLES.DOCTOR].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Portal accounts use an assigned ID to sign in." });
    }

    const email = String(req.body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }
    if (email === req.user.email) {
      return res.status(400).json({ success: false, message: "This is already your login email." });
    }
    if (await User.exists({ email, _id: { $ne: req.user._id } })) {
      return res.status(409).json({ success: false, message: "That email is already in use." });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    await sendEmailVerificationCode({ email, name: req.user.name || req.user.username, code });

    await User.findByIdAndUpdate(req.user._id, {
      pendingEmail: email,
      emailVerificationCodeHash: codeHash,
      emailVerificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await recordActivity({
      req,
      actor: req.user,
      action: "EMAIL_CHANGE_REQUESTED",
      target: req.user,
      details: "A verification code was sent for a login email change.",
    });

    return res.json({
      success: true,
      message: "Verification code sent. It expires in 10 minutes.",
      pendingEmail: email,
    });
  } catch (error) {
    const configurationError = error.message === "Email delivery is not configured.";
    const portConfigurationError = error.message.startsWith("SMTP_PORT must be");
    const authenticationError = error.code === "EAUTH";
    const connectionError = ["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED"].includes(error.code);
    const brevoConfigurationError = error.code === "EBREVO_CONFIG";
    const brevoAuthenticationError = error.code === "EBREVO_AUTH";
    const brevoRequestError = error.code === "EBREVO_REQUEST";
    const brevoConnectionError = error.code === "EBREVO_CONNECTION";
    const brevoIpBlockedError = error.code === "EBREVO_IP_BLOCKED";
    console.error("Email verification delivery failed:", {
      code: error.code || "UNKNOWN",
      command: error.command || "",
      message: error.message,
    });
    return res.status(configurationError || portConfigurationError || authenticationError || connectionError || brevoConfigurationError || brevoAuthenticationError || brevoRequestError || brevoConnectionError || brevoIpBlockedError ? 503 : 500).json({
      success: false,
      message: brevoIpBlockedError
        ? "Brevo blocked this server's IP address. Disable API IP blocking or authorize the server IP in Brevo Security settings."
        : brevoConfigurationError
        ? "Email verification is not configured. Add the Brevo API key and verified sender in Render."
        : brevoAuthenticationError
          ? "Brevo rejected the API key. Check BREVO_API_KEY in Render."
          : brevoRequestError
            ? "Brevo could not send the email. Check that the sender address is verified and the daily allowance is available."
            : brevoConnectionError
              ? "The Brevo email service could not be reached. Please try again shortly."
          : configurationError
        ? "Email verification is not configured. Ask the system administrator to configure an email provider."
        : portConfigurationError
          ? "Invalid SMTP port. Use port 587 for STARTTLS or port 465 for TLS."
        : authenticationError
          ? "SMTP authentication failed. Check the SMTP user and app password in Render."
          : connectionError
            ? "The email server could not be reached. Check the SMTP host and port, then try again."
        : "Could not send the verification email.",
    });
  }
};

export const verifyEmailChange = async (req, res) => {
  try {
    const code = String(req.body.code || "").trim();
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: "Enter the 6-digit verification code." });
    }

    const user = await User.findById(req.user._id)
      .select("+emailVerificationCodeHash +emailVerificationExpiresAt")
      .populate("patient", "patient_id first_name middle_name last_name")
      .populate("doctor", "doctor_id first_name middle_name last_name gender status");
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const validCode = user.pendingEmail &&
      user.emailVerificationCodeHash &&
      user.emailVerificationExpiresAt > new Date() &&
      crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(user.emailVerificationCodeHash));

    if (!validCode) {
      return res.status(400).json({ success: false, message: "The verification code is invalid or expired." });
    }
    if (await User.exists({ email: user.pendingEmail, _id: { $ne: user._id } })) {
      return res.status(409).json({ success: false, message: "That email is already in use." });
    }

    const previousEmail = user.email;
    user.email = user.pendingEmail;
    user.pendingEmail = "";
    user.emailVerificationCodeHash = "";
    user.emailVerificationExpiresAt = null;
    await user.save();

    await recordActivity({
      req,
      actor: user,
      action: "ACCOUNT_EMAIL_CHANGED",
      target: user,
      details: `Login email changed from ${previousEmail || "temporary login"} to ${user.email}.`,
    });

    return res.json({
      success: true,
      message: "Login email verified and updated.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "That email is already in use." });
    }
    return res.status(500).json({ success: false, message: "Could not verify the email address." });
  }
};

export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Enter your current password and a new password of at least 8 characters.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!await verifyPassword(currentPassword, user.password)) {
      await recordActivity({
        req,
        actor: user,
        action: "PASSWORD_CHANGE_FAILED",
        target: user,
        details: "Password change failed because the current password was incorrect.",
      });
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }
    if (await verifyPassword(newPassword, user.password)) {
      return res.status(400).json({
        success: false,
        message: "The new password must be different from your current password.",
      });
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    await recordActivity({
      req,
      actor: user,
      action: "ACCOUNT_PASSWORD_CHANGED",
      target: user,
      details: "User changed their account password.",
    });

    return res.json({ success: true, message: "Password changed successfully." });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to change password." });
  }
};
