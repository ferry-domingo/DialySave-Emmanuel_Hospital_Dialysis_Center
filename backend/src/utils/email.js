import nodemailer from "nodemailer";
import { lookup } from "node:dns/promises";

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const verificationMessage = ({ name, code }) => {
  const recipientName = name || "there";
  return {
    subject: "Verify your EHDC login email",
    text: `Hello ${recipientName},\n\nYour EHDC email verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this change, ignore this email.`,
    html: `<p>Hello ${escapeHtml(recipientName)},</p><p>Your EHDC email verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${escapeHtml(code)}</p><p>This code expires in 10 minutes. If you did not request this change, ignore this email.</p>`,
  };
};

const sendWithBrevo = async ({ email, name, code }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "EHDC";
  if (!apiKey || !senderEmail) {
    const error = new Error("Brevo email delivery is not configured.");
    error.code = "EBREVO_CONFIG";
    throw error;
  }

  const message = verificationMessage({ name, code });
  let response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email, name: name || undefined }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html,
        tags: ["email-verification"],
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (cause) {
    const error = new Error("The Brevo email API could not be reached.", { cause });
    error.code = "EBREVO_CONNECTION";
    throw error;
  }

  if (!response.ok) {
    const responseBody = await response.json().catch(() => ({}));
    const error = new Error(responseBody.message || `Brevo rejected the email request (${response.status}).`);
    const blockedByIpPolicy = /unrecognised ip|unrecognized ip|unauthorized ip|authori[sz]ed ip/i.test(error.message);
    error.code = blockedByIpPolicy
      ? "EBREVO_IP_BLOCKED"
      : response.status === 401
        ? "EBREVO_AUTH"
        : "EBREVO_REQUEST";
    error.status = response.status;
    throw error;
  }
};

const smtpConfig = async () => {
  const port = Number(process.env.SMTP_PORT || 587);
  if (![465, 587].includes(port)) {
    throw new Error("SMTP_PORT must be 587 (STARTTLS) or 465 (TLS).");
  }

  const hostname = process.env.SMTP_HOST;
  // Nodemailer's DNS resolver can stall on networks that block direct DNS
  // queries even though the operating-system resolver works normally.
  const { address } = await lookup(hostname, { family: 4 });

  return {
    host: address,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    tls: {
      servername: hostname,
      // Local antivirus/proxy products commonly inspect TLS with a certificate
      // from the Windows trust store, which Node 20 does not use. Production
      // continues to require a publicly trusted SMTP certificate.
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  };
};

export const sendEmailVerificationCode = async ({ email, name, code }) => {
  const provider = String(process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
  if (provider === "brevo" || (!provider && process.env.BREVO_API_KEY)) {
    await sendWithBrevo({ email, name, code });
    return;
  }

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.MAIL_FROM
  ) {
    throw new Error("Email delivery is not configured.");
  }

  const transporter = nodemailer.createTransport(await smtpConfig());
  const message = verificationMessage({ name, code });
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
};
