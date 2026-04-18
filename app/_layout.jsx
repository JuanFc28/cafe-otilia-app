import * as NavigationBar from "expo-navigation-bar";
// 1. IMPORTAMOS router DIRECTAMENTE (Quitamos useRouter)
import { Slot, router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

import { COLORS } from "../constants/theme";
import { AuthProvider, useAuth } from "../context/AuthContext";

const InitialLayout = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  // Evita que Expo Router intente navegar antes de estar listo
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) return;

    // En Expo Router, la ruta raíz (el login) tiene 0 segmentos
    const inAuthGroup = segments.length === 0;

    if (!user && !inAuthGroup) {
      router.replace("/");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/homeScreen");
    }
  }, [user, isLoading, segments, isMounted]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
    }
  }, []);

  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
