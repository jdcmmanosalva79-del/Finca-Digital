/**
 * cropController.js
 * Controlador para registrar siembras en Firestore y calcular
 * automáticamente las tareas según el ciclo del cultivo.
 * (Actualizado para usar SDK cliente)
 */

const { db } = require("../firebase-client");
const { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, Timestamp, serverTimestamp } = require("firebase/firestore");

// ─────────────────────────────────────────────
// Configuración de ciclos por rubro
// ─────────────────────────────────────────────
const CICLOS = {
  Maíz: {
    duracion: 120, // días totales del ciclo
    tareas: [
      {
        nombre: "Reabonado (Nitrógeno/Fósforo) - 1ra aplicación",
        diaRelativo: 25,
        tipo: "fertilizacion",
        completada: false,
      },
      {
        nombre: "Reabonado (Nitrógeno/Fósforo) - 2da aplicación",
        diaRelativo: 45,
        tipo: "fertilizacion",
        completada: false,
      },
    ],
  },
};

// ─────────────────────────────────────────────
// Función auxiliar: suma días a una fecha
// ─────────────────────────────────────────────
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ─────────────────────────────────────────────
// Función auxiliar: construye el array de tareas
// con fechas exactas calculadas desde fechaSiembra
// ─────────────────────────────────────────────
function calcularTareas(rubro, fechaSiembra) {
  const ciclo = CICLOS[rubro];
  if (!ciclo) {
    throw new Error(`Rubro "${rubro}" no tiene un ciclo configurado.`);
  }

  return ciclo.tareas.map((tarea) => {
    const fechaEjecucion = addDays(fechaSiembra, tarea.diaRelativo);
    return {
      nombre: tarea.nombre,
      tipo: tarea.tipo,
      diaRelativo: tarea.diaRelativo,
      fechaEjecucion: Timestamp.fromDate(fechaEjecucion),
      completada: false,
    };
  });
}

// ─────────────────────────────────────────────
// POST /api/crops
// Registra una nueva siembra en Firestore
// ─────────────────────────────────────────────
async function registrarSiembra(req, res) {
  try {
    const { rubro, hectareas, lote, fechaSiembra } = req.body;

    // ── Validaciones básicas ──
    if (!rubro || !hectareas || !lote || !fechaSiembra) {
      return res.status(400).json({
        error: "Faltan campos requeridos: rubro, hectareas, lote, fechaSiembra",
      });
    }

    if (!CICLOS[rubro]) {
      return res.status(400).json({
        error: `Rubro "${rubro}" no está soportado. Rubros válidos: ${Object.keys(CICLOS).join(", ")}`,
      });
    }

    // ── Parsear fecha de siembra ──
    const fechaSiembraDate = new Date(fechaSiembra);
    if (isNaN(fechaSiembraDate.getTime())) {
      return res.status(400).json({
        error: "Formato de fechaSiembra inválido. Use: YYYY-MM-DD",
      });
    }

    // ── Calcular fecha de finalización ──
    const ciclo = CICLOS[rubro];
    const fechaFinalizacion = addDays(fechaSiembraDate, ciclo.duracion);

    // ── Generar tareas con fechas calculadas ──
    const tareas = calcularTareas(rubro, fechaSiembraDate);

    // ── Construir documento ──
    const nuevaSiembra = {
      rubro,
      hectareas: Number(hectareas),
      lote,
      fechaSiembra: Timestamp.fromDate(fechaSiembraDate),
      fechaFinalizacion: Timestamp.fromDate(fechaFinalizacion),
      duracionDias: ciclo.duracion,
      estado: "activo",
      tareas,
      creadoEn: serverTimestamp(),
      rendimientoKg: null,
    };

    // ── Guardar en Firestore ──
    const docRef = await addDoc(collection(db, "crops"), nuevaSiembra);

    console.log(`[cropController] Siembra registrada con ID: ${docRef.id}`);

    return res.status(201).json({
      mensaje: "Siembra registrada exitosamente.",
      id: docRef.id,
      fechaFinalizacion: fechaFinalizacion.toISOString().split("T")[0],
      tareasProgramadas: tareas.map((t) => ({
        nombre: t.nombre,
        fecha: addDays(fechaSiembraDate, t.diaRelativo)
          .toISOString()
          .split("T")[0],
      })),
    });
  } catch (error) {
    console.error("[cropController] Error al registrar siembra:", error);
    return res.status(500).json({ error: error.message });
  }
}

// ─────────────────────────────────────────────
// GET /api/crops/tareas-hoy
// Devuelve las tareas cuya fechaEjecucion es hoy
// ─────────────────────────────────────────────
async function obtenerTareasDeHoy(req, res) {
  try {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const finDia    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    const q = query(collection(db, "crops"), where("estado", "==", "activo"));
    const snapshot = await getDocs(q);

    const tareasHoy = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tareasPendientes = (data.tareas || []).filter((t) => {
        if (t.completada) return false;
        const fechaEj = t.fechaEjecucion.toDate();
        return fechaEj >= inicioDia && fechaEj <= finDia;
      });

      tareasPendientes.forEach((t) => {
        tareasHoy.push({
          cropId: docSnap.id,
          rubro: data.rubro,
          lote: data.lote,
          tarea: t.nombre,
          tipo: t.tipo,
        });
      });
    });

    return res.status(200).json({ fecha: inicioDia.toISOString().split("T")[0], tareasHoy });
  } catch (error) {
    console.error("[cropController] Error al obtener tareas de hoy:", error);
    return res.status(500).json({ error: error.message });
  }
}

// ─────────────────────────────────────────────
// PATCH /api/crops/:id/finalizar
// Marca una siembra como finalizada y guarda el rendimiento
// ─────────────────────────────────────────────
async function finalizarSiembra(req, res) {
  try {
    const { id } = req.params;
    const { rendimientoKg } = req.body;

    if (!rendimientoKg || isNaN(Number(rendimientoKg))) {
      return res.status(400).json({ error: "rendimientoKg es requerido y debe ser un número." });
    }

    const docRef = doc(db, "crops", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Siembra no encontrada." });
    }

    await updateDoc(docRef, {
      estado: "finalizado",
      rendimientoKg: Number(rendimientoKg),
      finalizadoEn: serverTimestamp(),
    });

    console.log(`[cropController] Siembra ${id} finalizada. Rendimiento: ${rendimientoKg} kg.`);

    return res.status(200).json({
      mensaje: `Siembra finalizada. Lote ${docSnap.data().lote} liberado.`,
      rendimientoKg: Number(rendimientoKg),
    });
  } catch (error) {
    console.error("[cropController] Error al finalizar siembra:", error);
    return res.status(500).json({ error: error.message });
  }
}

// ─────────────────────────────────────────────
// PATCH /api/crops/:id/tareas/:index/completar
// Marca una tarea específica como completada
// ─────────────────────────────────────────────
async function completarTarea(req, res) {
  try {
    const { id, index } = req.params;
    const idxNum = parseInt(index, 10);

    const docRef = doc(db, "crops", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: "Siembra no encontrada." });
    }

    const tareas = docSnap.data().tareas || [];
    if (idxNum < 0 || idxNum >= tareas.length) {
      return res.status(400).json({ error: "Índice de tarea inválido." });
    }

    tareas[idxNum].completada = true;
    tareas[idxNum].completadaEn = Timestamp.now();

    await updateDoc(docRef, { tareas });

    console.log(`[cropController] Tarea ${idxNum} de siembra ${id} marcada como completada.`);
    return res.status(200).json({ mensaje: "Tarea completada.", tarea: tareas[idxNum] });
  } catch (error) {
    console.error("[cropController] Error al completar tarea:", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { registrarSiembra, obtenerTareasDeHoy, finalizarSiembra, completarTarea };
