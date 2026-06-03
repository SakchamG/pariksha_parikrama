// ============================================================
// FIREBASE CONFIGURATION — Pariksha Parikrama
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBZ9WVPk3SGsPGn2ge-HzfqliSYUK1-vSQ",
    authDomain: "pariksha-parikrama.firebaseapp.com",
    projectId: "pariksha-parikrama",
    storageBucket: "pariksha-parikrama.firebasestorage.app",
    messagingSenderId: "921313791530",
    appId: "1:921313791530:web:cd09d4a9a6d973096a7d53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);