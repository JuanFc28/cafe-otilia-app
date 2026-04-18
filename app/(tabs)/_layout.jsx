import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { COLORS } from "../../constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: "#EEEEEE",
        },
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
        name="homeScreen"
        options={{
          title: "Inicio",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* PANTALLA 2: ESTADÍSTICAS */}
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

      {/* PANTALLA 3: INVENTARIO */}
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
