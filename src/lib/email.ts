import nodemailer from "nodemailer";

const smtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!),
      secure: parseInt(process.env.SMTP_PORT!) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

interface SendVerificationEmailParams {
  email: string;
  token: string;
  locale: string;
}

export async function sendVerificationEmail({
  email,
  token,
  locale,
}: SendVerificationEmailParams): Promise<boolean> {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3001";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}&locale=${locale}`;

  const texts: Record<string, { subject: string; heading: string; body: string; button: string; expiry: string }> = {
    en: {
      subject: "Verify your email - MotoGP Predictions 2026",
      heading: "Verify Your Email",
      body: "Click the button below to verify your email address and activate your account.",
      button: "Verify Email",
      expiry: "This link will expire in 24 hours.",
    },
    it: {
      subject: "Verifica la tua email - MotoGP Predictions 2026",
      heading: "Verifica la Tua Email",
      body: "Clicca il bottone qui sotto per verificare il tuo indirizzo email e attivare il tuo account.",
      button: "Verifica Email",
      expiry: "Questo link scadr\u00e0 tra 24 ore.",
    },
    es: {
      subject: "Verifica tu email - MotoGP Predictions 2026",
      heading: "Verifica Tu Email",
      body: "Haz clic en el bot\u00f3n de abajo para verificar tu direcci\u00f3n de email y activar tu cuenta.",
      button: "Verificar Email",
      expiry: "Este enlace expirar\u00e1 en 24 horas.",
    },
  };

  const t = texts[locale] || texts.en;

  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #dc2626; margin: 0;">MotoGP Predictions 2026</h1>
      </div>
      <h2 style="text-align: center; color: #111;">${t.heading}</h2>
      <p style="text-align: center; color: #666; font-size: 16px;">${t.body}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          ${t.button}
        </a>
      </div>
      <p style="text-align: center; color: #999; font-size: 12px;">${t.expiry}</p>
    </div>
  `;

  if (!transporter) {
    console.log("\n========== EMAIL VERIFICATION ==========");
    console.log(`To: ${email}`);
    console.log(`Verify URL: ${verifyUrl}`);
    console.log("=========================================\n");
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@motogp-predictions.com",
      to: email,
      subject: t.subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}
