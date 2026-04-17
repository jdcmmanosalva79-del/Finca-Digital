const express  = require("express");
const router   = express.Router();
const { registrarSiembra, obtenerTareasDeHoy, finalizarSiembra, completarTarea } = require("../controllers/cropController");

// POST   /api/crops                              → Registrar nueva siembra
router.post("/", registrarSiembra);

// GET    /api/crops/tareas-hoy                   → Tareas pendientes del día
router.get("/tareas-hoy", obtenerTareasDeHoy);

// PATCH  /api/crops/:id/finalizar               → Finalizar ciclo con rendimiento
router.patch("/:id/finalizar", finalizarSiembra);

// PATCH  /api/crops/:id/tareas/:index/completar → Marcar tarea como completada
router.patch("/:id/tareas/:index/completar", completarTarea);

module.exports = router;
