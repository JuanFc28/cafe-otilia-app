import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
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
  const { logout } = useAuth();

  const notifications = [
    { id: "1", name: "Juan Cruz", status: "hace 1 mes" },
    { id: "2", name: "Juan Cruz", status: "hace 15 dias" },
  ];

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            try {
              // Logout y redireccion a _layout.jsx (loginpage)
              await logout();
              router.replace("/");
            } catch (error) {
              console.log("Error al salir:", error);
              Alert.alert("Error", "No se pudo cerrar la sesión.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/*Header de Saludo*/}
        <View style={styles.curvedHeader}>
          <View
            style={{
              height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20,
            }}
          />
          <Text style={styles.greetingText}>¡Hola {userName}! 👋🏼</Text>
          {/*Logout button*/}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        {/*Boton Registrar venta */}
        <View style={styles.innerContainer}>
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
            {/*Boton Ver Clientes*/}
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() => router.push("/clients/clientsList")}
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
          {/*Seccion notificaciones*/}
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

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 20 },
  curvedHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: "center",
  },
  greetingText: { fontSize: 28, fontWeight: "bold", color: COLORS.white },
  innerContainer: { paddingHorizontal: 20, marginTop: -30 },
  actionsContainer: { gap: 15, marginBottom: 30 },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
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
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 16, color: COLORS.gray },
  actionSubtitle: { fontSize: 22, fontWeight: "bold", color: COLORS.primary },
  notificationsHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.primary },
  notificationItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
    elevation: 2,
  },
  notificationIcon: { marginRight: 15 },
  notificationInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  lastPurchaseText: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  whatsappButton: { padding: 5 },
  logoutButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20,
    right: 20,
    padding: 5,
    zIndex: 10,
  },
});
