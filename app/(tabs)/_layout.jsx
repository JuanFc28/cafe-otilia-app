import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { COLORS } from "../../constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Color del icono cuando está seleccionado (Naranja)
        tabBarActiveTintColor: COLORS.secondary,
        // Color del icono cuando no está seleccionado (Gris)
        tabBarInactiveTintColor: COLORS.gray,
        // Estilo de la barrita de abajo
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: "#EEEEEE",
        },
        // Estilo de la cabecera (Header) en la parte superior
        headerStyle: {
          backgroundColor: COLORS.primary, // Café
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      {/* PANTALLA 1: HOME (index.jsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* Las otras pantallas las iremos descomentando cuando las creemos */}

      <Tabs.Screen
        name="stats"
        options={{
          title: "Estadísticas",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="stock"
        options={{
          title: "Inventario",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="cube" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
