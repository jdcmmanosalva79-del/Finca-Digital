import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyCEaEX4e7DIaK_qRUp2ovzl8nkeWOVfWgQ",
  authDomain: "finca-digital-51f2f.firebaseapp.com",
  databaseURL: "https://finca-digital-51f2f-default-rtdb.firebaseio.com",
  projectId: "finca-digital-51f2f",
  storageBucket: "finca-digital-51f2f.firebasestorage.app",
  messagingSenderId: "920614478954",
  appId: "1:920614478954:web:dce766c98375133b425613",
  measurementId: "G-NDZ4B6TVST"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
