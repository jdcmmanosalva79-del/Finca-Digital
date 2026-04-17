/**
 * server/firebase-admin.js
 * Inicialización única de Firebase Admin SDK.
 * Usa variables de entorno para no depender de serviceAccountKey.json
 * → Compatible con Netlify Functions y con el servidor local.
 *
 * Variables requeridas (en .env o en Netlify → Environment variables):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (con \n literales, Netlify los preserva)
 */

const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    // ── Opción A: JSON completo en una variable (más fácil para Netlify) ──
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log("Firebase Admin inicializado (Opción A).");
    }
    // ── Opción B: Variables individuales ──
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Las claves privadas vienen con \n escapados desde Netlify
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      console.log("Firebase Admin inicializado (Opción B).");
    } else {
      console.error("⚠️ FIREBASE ADMIN NO INICIALIZADO: Faltan variables de entorno en el backend.");
    }
  } catch (error) {
    console.error("⚠️ Error inicializando Firebase Admin:", error.message);
  }
}

module.exports = admin;
