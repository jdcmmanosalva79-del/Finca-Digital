/**
 * index.js — Punto de entrada del servidor Node.js
 */

require("dotenv").config();
const express  = require("express");
const cors     = require("cors");

// ── Importar rutas y cron ──
const cropRoutes            = require("./routes/cropRoutes");
const notificacionRoutes    = require("./routes/notificacionRoutes");
const { iniciarCronClima }  = require("./cron/weatherCron");

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ── Rutas ──
app.use("/api/crops", cropRoutes);
app.use("/api/notificaciones", notificacionRoutes);

// ── Health check ──
app.get("/", (req, res) => res.json({ estado: "Finca Digital API corriendo 🌱" }));

// ── Iniciar Cron Job del clima ──
iniciarCronClima();

app.listen(PORT, () => console.log(`[server] Escuchando en http://localhost:${PORT}`));
