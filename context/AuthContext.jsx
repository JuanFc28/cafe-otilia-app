import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/config";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
      } catch (error) {
        console.error("Error en AuthContext:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  //funcion de Login
  const login = async (email, pass) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    setUser(userCredential.user);
    return userCredential;
  };
  //Funcion de registro
  const register = async (email, pass, name) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      pass,
    );
    await updateProfile(userCredential.user, { displayName: name });
    setUser(userCredential.user);
    return userCredential;
  };
  //Funcion de logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      // Solo cerramos sesión en Firebase y redirecciona en automatico
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
