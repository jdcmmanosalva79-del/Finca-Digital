/**
 * whatsappService.js
 * Servicio de envío de mensajes WhatsApp.
 * Soporta UltraMsg y Twilio (configurable por variable de entorno).
 */

const axios = require("axios");

const PROVIDER = process.env.WHATSAPP_PROVIDER || "ultramsg"; // "ultramsg" | "twilio"

// ─────────────────────────────────────────────
// UltraMsg
// ─────────────────────────────────────────────
async function enviarConUltraMsg(telefono, mensaje) {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token      = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    throw new Error("Faltan credenciales de UltraMsg (ULTRAMSG_INSTANCE_ID, ULTRAMSG_TOKEN).");
  }

  const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
  await axios.post(
    url,
    new URLSearchParams({
      token,
      to: telefono.startsWith("+") ? telefono : `+${telefono}`,
      body: mensaje,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
}

// ─────────────────────────────────────────────
// Twilio
// ─────────────────────────────────────────────
async function enviarConTwilio(telefono, mensaje) {
  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber  = process.env.TWILIO_WHATSAPP_FROM; // ej. "whatsapp:+14155238886"

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Faltan credenciales de Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM).");
  }

  const to = `whatsapp:${telefono.startsWith("+") ? telefono : "+" + telefono}`;

  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    new URLSearchParams({ From: fromNumber, To: to, Body: mensaje }),
    {
      auth: { username: accountSid, password: authToken },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
}

// ─────────────────────────────────────────────
// Función pública: despacha al proveedor elegido
// ─────────────────────────────────────────────
async function enviarAlertaWhatsApp(telefono, mensaje) {
  if (PROVIDER === "twilio") {
    return enviarConTwilio(telefono, mensaje);
  }
  return enviarConUltraMsg(telefono, mensaje);
}

module.exports = { enviarAlertaWhatsApp };
