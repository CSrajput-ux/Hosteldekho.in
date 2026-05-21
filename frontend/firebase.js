// ─────────────────────────────────────────────────────────────
// Frontend — Firebase Client SDK
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFjm1HahCT1oYaqXyzqyeuJQC_XGrb-Ls",
  authDomain: "hosteldekho-c8eca.firebaseapp.com",
  projectId: "hosteldekho-c8eca",
  storageBucket: "hosteldekho-c8eca.firebasestorage.app",
  messagingSenderId: "40726329823",
  appId: "1:40726329823:web:4d59674feb6c862232ac6a",
  measurementId: "G-WKS2C4GC6S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { auth, googleProvider };
