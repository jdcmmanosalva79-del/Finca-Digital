/**
 * notificacionRoutes.js
 * Endpoint de prueba para verificar que WhatsApp funciona.
 */

const express = require("express");
const router  = express.Router();
const { enviarAlertaWhatsApp } = require("../services/whatsappService");

// POST /api/notificaciones/test
router.post("/test", async (req, res) => {
  const { telefono } = req.body;
  if (!telefono) return res.status(400).json({ error: "telefono requerido." });

  try {
    await enviarAlertaWhatsApp(
      telefono,
      "🌱 *Finca Digital* — Mensaje de prueba. ¡Las notificaciones están funcionando correctamente! ✅"
    );
    res.json({ mensaje: "Mensaje de prueba enviado." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
