import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app = null;
let analytics = null;
let db = null;
let auth = null;
let firebaseError = null;

if (!firebaseConfig.apiKey) {
  firebaseError = "Faltan las variables de entorno de Firebase. VITE_FIREBASE_API_KEY no está definido.";
} else {
  try {
    app = initializeApp(firebaseConfig);
    analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    firebaseError = error.message || "Error desconocido al inicializar Firebase";
  }
}

export { app, analytics, db, auth, firebaseError };
export default app;
