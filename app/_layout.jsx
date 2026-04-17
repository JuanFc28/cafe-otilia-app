import * as NavigationBar from "expo-navigation-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { auth } from "../firebase/config";

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const segments = useSegments(); // Nos dice en qué carpeta estamos parados

  useEffect(() => {
    // Solo aplicamos esto en Android
    if (Platform.OS === "android") {
      // Oculta la barra
      NavigationBar.setVisibilityAsync("hidden");
      // Hace que aparezca temporalmente al deslizar y se vuelva a ocultar
    }
  }, []);

  // 1. Escuchamos a Firebase para ver si hay un usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return () => unsubscribe();
  }, [initializing]);

  // 2. Protegemos las rutas
  useEffect(() => {
    if (initializing) return; // Si Firebase sigue pensando, no hacemos nada

    // Verificamos si el usuario está en (tabs) o en (sales)
    const inProtectedGroup =
      segments[0] === "(tabs)" ||
      segments[0] === "sales" ||
      segments[0] === "clients";

    if (user && !inProtectedGroup) {
      // Si hay usuario pero está en el Login, lo pateamos pa' adentro
      router.replace("/(tabs)");
    } else if (!user && inProtectedGroup) {
      // Si NO hay usuario y se coló a los tabs, lo pateamos al Login
      router.replace("/");
    }
  }, [user, initializing, segments]);

  // Siempre renderizamos el Stack para que Expo Router no se rompa
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
    </Stack>
  );
}
