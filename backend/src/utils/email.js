import nodemailer from "nodemailer";

const smtpConfig = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  if (![465, 587].includes(port)) {
    throw new Error("SMTP_PORT must be 587 (STARTTLS) or 465 (TLS).");
  }
  return {
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  };
};

export const sendEmailVerificationCode = async ({ email, name, code }) => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.MAIL_FROM
  ) {
    throw new Error("Email delivery is not configured.");
  }

  const transporter = nodemailer.createTransport(smtpConfig());
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Verify your EHDC login email",
    text: `Hello ${name || "there"},\n\nYour EHDC email verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this change, ignore this email.`,
    html: `<p>Hello ${name || "there"},</p><p>Your EHDC email verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request this change, ignore this email.</p>`,
  });
};
