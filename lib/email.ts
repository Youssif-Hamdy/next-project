import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendVerificationEmail(to: string, verifyPath: string) {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = verifyPath.startsWith("http") ? verifyPath : `${base.replace(/\/$/, "")}${verifyPath}`;

  const transport = getTransport();
  const from = process.env.SMTP_FROM ?? "noreply@localhost";

  if (!transport) {
    console.info("[email] SMTP not configured. Verification link:", link);
    return { sent: false, link };
  }

  await transport.sendMail({
    from,
    to,
    subject: "Confirm your email",
    text: `Confirm your account: ${link}`,
    html: `<p>Confirm your account:</p><p><a href="${link}">${link}</a></p>`,
  });

  return { sent: true, link };
}

export async function sendNewsletterEmail(to: string, subject: string, html: string) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM ?? "noreply@localhost";
  if (!transport) {
    console.info("[email] Newsletter skipped (no SMTP):", to, subject);
    return { sent: false };
  }
  await transport.sendMail({ from, to, subject, html });
  return { sent: true };
}
