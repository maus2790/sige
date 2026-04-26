import nodemailer from "nodemailer";

// Configurar transporte de email
// Para desarrollo, puedes usar ethereal.email (email falso)
// Para producción, usa SMTP real (Gmail, SendGrid, Resend, etc.)

let transporter: nodemailer.Transporter;

async function createTransporter() {
  // Configuración para desarrollo con ethereal (email falso)
  if (process.env.NODE_ENV !== "production") {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Configuración para producción con Gmail (requiere contraseña de aplicación)
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });
}

// Inicializar transporter
async function getTransporter() {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
}

// Función para enviar email de recuperación de contraseña
export async function sendResetEmail(to: string, resetUrl: string, name: string) {
  const transporter = await getTransporter();
  
  const mailOptions = {
    from: '"SIGE Marketplace" <noreply@sige.com>',
    to,
    subject: "Recupera tu contraseña - SIGE Marketplace",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">SIGE Marketplace</h1>
        <h2>Recupera tu contraseña</h2>
        <p>Hola ${name},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Restablecer contraseña
        </a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">SIGE Marketplace - Tu tienda en Bolivia</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  
  // Si usas ethereal, muestra la URL de previsualización
  if (process.env.NODE_ENV !== "production") {
    console.log("📧 Email de prueba disponible en:", nodemailer.getTestMessageUrl(info));
  }
  
  return info;
}