// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { auth, db };

const auth = initializeAuth(app, {
  persistence:
    Platform.OS === "web"
      ? browserLocalPersistence
      : getReactNativePersistence(AsyncStorage),
});
