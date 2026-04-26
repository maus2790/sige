//lib/send-reset-email.ts
import { resend } from "./resend";

export async function sendResetEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

  const { data, error } = await resend.emails.send({
    from: "SIGE Marketplace <onboarding@resend.dev>",
    to: email,
    subject: "Recupera tu contraseña - SIGE Marketplace",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3B82F6;">SIGE Marketplace</h1>
        <h2>Restablece tu contraseña</h2>
        <p>Hola ${name},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Restablecer contraseña
        </a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste esto, ignora este mensaje.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">SIGE Marketplace - Tu tienda en Bolivia</p>
      </div>
    `,
  });

  if (error) {
    console.error("Error sending email:", error);

    // En desarrollo, mostramos el link en consola por si Resend bloquea el envío
    if (process.env.NODE_ENV === "development") {
      console.log("\n🔑 [DEBUG] ENLACE DE RECUPERACIÓN:", resetUrl, "\n");
    }

    throw new Error("No se pudo enviar el email");
  }

  return data;
}