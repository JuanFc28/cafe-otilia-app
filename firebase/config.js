// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
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

// 2. Variables globales para exportar
let app;
let auth;

// 3. Verificamos si Firebase ya fue inicializado por Expo
if (getApps().length === 0) {
  // Si no existe, creamos la app y le ponemos la persistencia
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  // Si ya existe (por guardar un archivo), recuperamos la instancia
  app = getApp();
  auth = getAuth(app);
}

// 4. Inicializamos la base de datos
const db = getFirestore(app);

// 5. Exportamos para poder usarlos en otras pantallas
export { auth, db };
export default app;
