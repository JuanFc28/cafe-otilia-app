import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { auth } from "../../firebase/config";

export default function HomeScreen() {
  const userName = auth.currentUser?.displayName || "Juan";

  // Datos de ejemplo para las notificaciones [cite: 1]
  const notifications = [
    { id: "1", name: "Juan Cruz", status: "hace 1 mes" },
    { id: "2", name: "Juan Cruz", status: "hace 15 dias" },
    { id: "3", name: "Juan Cruz", status: "hace 1 mes" },
    { id: "4", name: "Juan Cruz", status: "hace 1 mes" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CABECERA CURVA CON SALUDO */}
        <View style={styles.curvedHeader}>
          {/* Espacio extra para que no se pegue al reloj/batería del celular */}
          <View
            style={{
              height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20,
            }}
          />
          <Text style={styles.greetingText}>¡Hola {userName}! 👋</Text>
        </View>

        {/* CONTENIDO PRINCIPAL (Le damos un margen negativo para que "suba" y se superponga a la curva) */}
        <View style={styles.innerContainer}>
          {/* BOTONES PRINCIPALES */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() => router.push("/sales/new-sale")}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: COLORS.secondary },
                ]}
              >
                <Ionicons name="cart" size={30} color={COLORS.white} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Registrar</Text>
                <Text style={styles.actionSubtitle}>Venta</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() => router.push("/clients")}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: COLORS.primary },
                ]}
              >
                <Ionicons name="people" size={30} color={COLORS.white} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Ver</Text>
                <Text style={styles.actionSubtitle}>Clientes</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* SECCIÓN DE NOTIFICACIONES */}
          <View style={styles.notificationsHeader}>
            <Text style={styles.sectionTitle}>Notificaciones</Text>
          </View>

          {notifications.map((item) => (
            <View key={item.id} style={styles.notificationItem}>
              <View style={styles.notificationIcon}>
                <Ionicons
                  name="notifications"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>
              <View style={styles.notificationInfo}>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.lastPurchaseText}>
                  Ultima compra {item.status}
                </Text>
              </View>
              <TouchableOpacity style={styles.whatsappButton}>
                <Ionicons
                  name="logo-whatsapp"
                  size={24}
                  color={COLORS.success}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Crema Latte
  },
  scrollContent: {
    paddingBottom: 20,
  },
  curvedHeader: {
    backgroundColor: COLORS.primary, // Café Espresso
    paddingHorizontal: 20,
    paddingBottom: 60, // Más padding abajo para la curva
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: "center",
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white, // Lo ponemos en blanco para que resalte sobre el café
  },
  innerContainer: {
    paddingHorizontal: 20,
    marginTop: -30, // ¡Magia! Sube las tarjetas para que se sobrepongan un poco al header café
  },
  actionsContainer: {
    gap: 15,
    marginBottom: 30,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, // Sombra más notoria
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    color: COLORS.gray, // Suavizamos este texto para que resalte el subtítulo
  },
  actionSubtitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  notificationsHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  notificationItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  lastPurchaseText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  whatsappButton: {
    padding: 5,
  },
});
