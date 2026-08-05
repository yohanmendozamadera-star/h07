import "server-only";

type Attachment = { filename: string; content: string };

// Envío directo (fetch a la API REST de Resend), sin agregar el SDK como
// dependencia nueva — un solo endpoint, no vale la pena el paquete completo.
// Usado desde el servidor (Node) para correos con adjuntos (el recibo en
// PDF); los recordatorios de vencimiento van aparte, directo desde Postgres
// vía pg_net (ver migración 20260805090000_payment_reminders.sql).
export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}): Promise<{ success: boolean; message?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, message: "RESEND_API_KEY no está configurada." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "H07 <noreply@h07.io>",
      to: [to],
      subject,
      html,
      attachments,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { success: false, message: `Resend respondió ${response.status}: ${body}` };
  }

  return { success: true };
}
