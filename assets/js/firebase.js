// Firebase initialization and helpers for the Gram Panchayat app
// Replace the firebaseConfig values with your own project settings
// from the Firebase console (Project settings -> General -> Web app).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// TODO: put your real Firebase config here before deploying
const firebaseConfig = {
  apiKey: "AIzaSyDxij0tkpRgHtPVjDP0nfoufHf_J6-7d98",
  authDomain: "egram-panchayat-18ce3.firebaseapp.com",
  projectId: "egram-panchayat-18ce3",
  storageBucket: "egram-panchayat-18ce3.firebasestorage.app",
  messagingSenderId: "108675088666",
  appId: "1:108675088666:web:ce49987196c86ac5882ca3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Logging helper (FireBaseLogging style) ---
// To avoid paid Firestore, we persist logs in localStorage.
// You can later switch this to Firestore or Realtime Database
// without changing the rest of the app.
async function logToFirebase(payload) {
  try {
    const key = "gp_logs";
    const existingRaw = localStorage.getItem(key);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    existing.push(payload);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (err) {
    console.warn("Failed to persist log locally", err);
  }
}

export {
  app,
  auth,
  // auth helpers
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  // logging helper
  logToFirebase,
};

