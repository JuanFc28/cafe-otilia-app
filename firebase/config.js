// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSUUzGWPPFQgGBI_9o_vQBvjO6LNVhh5A",
  authDomain: "cafe-otilia.firebaseapp.com",
  projectId: "cafe-otilia",
  storageBucket: "cafe-otilia.firebasestorage.app",
  messagingSenderId: "934341662273",
  appId: "1:934341662273:web:8bcea3e54737fa7b0ad8c0",
  measurementId: "G-LRWK3BLQDF",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
