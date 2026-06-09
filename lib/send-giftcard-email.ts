'use server';

import { resend } from "@/lib/resend";

export async function sendGiftCardEmail(data: {
  to: string;
  recipientName: string;
  senderName: string;
  message: string;
  cardImageUrl: string;
  amount: number;
  code: string;
  storeId?: string;
}) {
  const storeId = data.storeId || "SIGE-GLOBAL";
  const redeemUrl = storeId === "SIGE-GLOBAL"
    ? "https://sige.click"
    : `https://sige.click/tienda/${storeId}`;

  if (!resend) {
    console.warn("⚠️ Resend is not configured (RESEND_API_KEY is missing).");
    if (process.env.NODE_ENV === "development") {
      console.log("\n🎁 [DEBUG] GIFT CARD EMAIL NOT SENT (Missing API Key):", {
        to: data.to,
        recipient: data.recipientName,
        sender: data.senderName,
        code: data.code,
        amount: data.amount,
        redeemUrl
      }, "\n");
    }
    throw new Error("El servicio de correo no está configurado, pero puedes ver los detalles en la consola de desarrollo.");
  }

  const { data: result, error } = await resend.emails.send({
    from: `"SIGE Marketplace" <hola@sige.click>`,
    to: data.to,
    subject: `¡Te regalaron una Gift Card de Bs. ${data.amount.toFixed(2)}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background-color: #ffffff;">
        <h1 style="color: #2563EB; margin-top: 0; font-size: 24px; text-align: center;">¡Felicidades, ${data.recipientName}!</h1>
        <p style="font-size: 16px; color: #475569; text-align: center;">
          <strong>${data.senderName}</strong> te ha enviado una Gift Card de SIGE Marketplace.
        </p>
        
        ${data.cardImageUrl ? `
        <div style="margin: 24px 0; text-align: center;">
          <img src="${data.cardImageUrl}" alt="Gift Card" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />
        </div>
        ` : ''}

        <div style="background-color: #F8FAFC; border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #64748B; text-transform: uppercase; tracking-wider: 0.05em;">Mensaje:</p>
          <p style="margin: 0; font-style: italic; color: #1e293b; font-size: 16px;">"${data.message || '¡Disfruta tu regalo!'}"</p>
        </div>

        <div style="text-align: center; margin: 32px 0 16px 0;">
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #64748B;">Código de Canje:</p>
          <p style="margin: 0 0 20px 0; font-size: 22px; font-weight: bold; letter-spacing: 0.1em; color: #0F172A; font-family: monospace;">${data.code}</p>
          
          <a href="${redeemUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
            Canjear Gift Card en Tienda
          </a>
        </div>

        <hr style="margin: 32px 0 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
        <p style="text-align: center; color: #94A3B8; font-size: 12px; margin: 0;">
          SIGE Marketplace • Tu tienda en Bolivia
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Error sending email via Resend:", error);
    throw new Error("No se pudo enviar el correo de la Gift Card");
  }

  return result;
}
