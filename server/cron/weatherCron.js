/**
 * weatherCron.js
 * Cron job diario a las 6:00 AM.
 * Consulta OpenWeatherMap para Barinas, Venezuela.
 * Genera alerta de riego o lluvia y la guarda en Firestore.
 * Opcionalmente envía notificación WhatsApp.
 * (Actualizado para usar SDK cliente)
 */

const cron = require("node-cron");
const axios = require("axios");
const { db } = require("../firebase-client");
const { collection, addDoc, query, where, getDocs, Timestamp } = require("firebase/firestore");
const { enviarAlertaWhatsApp } = require("../services/whatsappService");

// ─────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const CIUDAD_ID           = "3626280"; // ID de OpenWeatherMap para Barinas, VE
const UMBRAL_LLUVIA       = 70;        // % de probabilidad de lluvia para alerta

// ─────────────────────────────────────────────
// Función principal: consulta clima y genera decisión
// ─────────────────────────────────────────────
async function consultarClimayGenerarAlerta() {
  console.log(`[weatherCron] Ejecutando consulta de clima - ${new Date().toISOString()}`);

  try {
    // ── 1. Llamar a OpenWeatherMap (forecast de 5 días / 3 horas) ──
    const url = `https://api.openweathermap.org/data/2.5/forecast?id=${CIUDAD_ID}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es&cnt=4`;
    const { data } = await axios.get(url);

    // ── 2. Calcular la probabilidad de lluvia máxima del día ──
    // "pop" = Probability of Precipitation (0.0 - 1.0)
    const pronosticos = data.list; // primeras 4 franjas de 3h = 12 horas del día
    const popMax = Math.max(...pronosticos.map((p) => (p.pop || 0) * 100));

    // ── 3. Temperatura y descripción del clima principal ──
    const tempActual      = pronosticos[0].main.temp;
    const descripcionClima = pronosticos[0].weather[0].description;

    // ── 4. Determinar decisión de riego ──
    let decision;
    let tipoAlerta;

    if (popMax > UMBRAL_LLUVIA) {
      decision   = `🌧️ No regar, lluvia intensa. Prob. de lluvia: ${Math.round(popMax)}%.`;
      tipoAlerta = "lluvia";
    } else if (popMax < 20 && tempActual > 32) {
      decision   = `☀️ Iniciar ciclo de riego. Sin lluvia esperada. Temp: ${tempActual}°C.`;
      tipoAlerta = "sequia";
    } else {
      decision   = `🌤️ Condición normal. Prob. lluvia: ${Math.round(popMax)}%, Temp: ${tempActual}°C. No se requiere riego adicional.`;
      tipoAlerta = "normal";
    }

    console.log(`[weatherCron] Decisión: ${decision}`);

    // ── 5. Guardar alerta en Firestore (colección: alertasClima) ──
    const alertaDoc = {
      fecha: Timestamp.now(),
      ciudad: "Barinas",
      popMax: Math.round(popMax),
      tempActual,
      descripcionClima,
      decision,
      tipoAlerta,
    };

    const alertaRef = await addDoc(collection(db, "alertasClima"), alertaDoc);
    console.log(`[weatherCron] Alerta guardada en Firestore con ID: ${alertaRef.id}`);

    // ── 6. Obtener tareas de fertilización del día ──
    const hoy       = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const finDia    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    const cropsQuery = query(collection(db, "crops"), where("estado", "==", "activo"));
    const cropsSnapshot = await getDocs(cropsQuery);
    const tareasHoy = [];

    cropsSnapshot.forEach((docSnap) => {
      const crop = docSnap.data();
      (crop.tareas || []).forEach((t) => {
        if (!t.completada) {
          const fechaEj = t.fechaEjecucion.toDate();
          if (fechaEj >= inicioDia && fechaEj <= finDia) {
            tareasHoy.push(`📋 ${crop.rubro} (Lote: ${crop.lote}): ${t.nombre}`);
          }
        }
      });
    });

    // ── 7. Componer mensaje final ──
    const fechaStr = hoy.toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" });
    let mensajeCompleto = `🌱 *Finca Digital – Reporte del ${fechaStr}*\n\n${decision}`;

    if (tareasHoy.length > 0) {
      mensajeCompleto += `\n\n*Tareas de hoy:*\n${tareasHoy.join("\n")}`;
    } else {
      mensajeCompleto += `\n\n✅ Sin tareas de fertilización programadas hoy.`;
    }

    // ── 8. Enviar WhatsApp a usuarios con notificaciones activas ──
    const usuariosQuery = query(collection(db, "usuarios"), where("notificacionesActivas", "==", true));
    const usuariosSnapshot = await getDocs(usuariosQuery);

    const promesas = [];
    usuariosSnapshot.forEach((docSnap) => {
      const usuario = docSnap.data();
      if (usuario.telefono) {
        promesas.push(
          enviarAlertaWhatsApp(usuario.telefono, mensajeCompleto)
            .then(() => console.log(`[weatherCron] WhatsApp enviado a ${usuario.telefono}`))
            .catch((err) => console.error(`[weatherCron] Error enviando a ${usuario.telefono}:`, err.message))
        );
      }
    });

    await Promise.all(promesas);
    console.log(`[weatherCron] Ciclo completado. Usuarios notificados: ${promesas.length}`);
  } catch (error) {
    console.error("[weatherCron] Error en el ciclo:", error.message);
  }
}

// ─────────────────────────────────────────────
// Registrar el Cron Job: todos los días a las 6:00 AM
// Zona horaria: America/Caracas (VET = UTC-4)
// ─────────────────────────────────────────────
function iniciarCronClima() {
  cron.schedule(
    "0 6 * * *",
    consultarClimayGenerarAlerta,
    {
      scheduled: true,
      timezone: "America/Caracas",
    }
  );
  console.log("[weatherCron] Cron de clima registrado — se ejecuta a las 6:00 AM (Caracas).");
}

module.exports = { iniciarCronClima, consultarClimayGenerarAlerta };
