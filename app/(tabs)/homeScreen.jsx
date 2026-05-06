import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const userName = user?.displayName || user?.email?.split("@")[0] || "Dueño";

  // BUSCAR CLIENTES CON RECORDATORIOS PRÓXIMOS
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "clients"),
      where("userId", "==", user.uid),
      where("alertDays", "<=", 15),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeAlerts = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // ocultar los que ya fueron notificados
        .filter((client) => client.isNotified !== true);

      setNotifications(activeAlerts);
    });

    return () => unsubscribe();
  }, [user]);

  const openWhatsApp = (phone) => {
    const url = `https://wa.me/52${phone}`;
    Linking.openURL(url);
  };

  // Marcar como notificado con confirmación
  const markAsNotified = (clientId, clientName) => {
    Alert.alert(
      "Confirmar notificación",
      `¿Deseas marcar a ${clientName} como ya notificado? Esto lo quitará de esta lista.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            try {
              await updateDoc(doc(db, "clients", clientId), {
                isNotified: true
              });
            } catch (error) {
              console.error("Error al marcar como notificado:", error);
              Alert.alert("Error", "No se pudo actualizar el estado.");
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => await logout(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.curvedHeader}>
          <View style={{ height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20 }} />
          <Text style={styles.greetingText}>¡Hola {userName}! 👋🏼</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.innerContainer}>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/sales/new-sale")}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.secondary }]}>
                <Ionicons name="cart" size={30} color={COLORS.white} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Registrar</Text>
                <Text style={styles.actionSubtitle}>Venta</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/clients/clientsList")}>
              <View style={[styles.iconContainer, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="people" size={30} color={COLORS.white} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Ver</Text>
                <Text style={styles.actionSubtitle}>Clientes</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.notificationsHeader}>
            <Text style={styles.sectionTitle}>Recordatorios Próximos</Text>
          </View>

          {notifications.length > 0 ? (
            notifications.map((item) => (
              <View key={item.id} style={styles.notificationItem}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="notifications" size={20} color={COLORS.secondary} />
                </View>
                <View style={styles.notificationInfo}>
                  <Text style={styles.customerName}>{item.name}</Text>
                  <Text style={styles.lastPurchaseText}>Alerta en {item.alertDays} días</Text>
                </View>
                
                {/* NUEVO: Contenedor con los dos botones (WhatsApp y Check) */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity style={styles.whatsappButton} onPress={() => openWhatsApp(item.phone)}>
                    <Ionicons name="logo-whatsapp" size={24} color={COLORS.success} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.whatsappButton, { marginLeft: 10 }]} 
                    onPress={() => markAsNotified(item.id, item.name)}
                  >
                    <Ionicons name="checkmark-circle" size={26} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

              </View>
            ))
          ) : (
            <Text style={{ textAlign: "center", color: COLORS.gray, marginTop: 10 }}>
              No hay alertas pendientes. ¡Todo al día! 🎉
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 20 },
  curvedHeader: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: "center" },
  greetingText: { fontSize: 28, fontWeight: "bold", color: COLORS.white },
  innerContainer: { paddingHorizontal: 20, marginTop: -30 },
  actionsContainer: { gap: 15, marginBottom: 30 },
  actionCard: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, flexDirection: "row", alignItems: "center", elevation: 5 },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginRight: 20 },
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 16, color: COLORS.gray },
  actionSubtitle: { fontSize: 22, fontWeight: "bold", color: COLORS.primary },
  notificationsHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.primary },
  notificationItem: { backgroundColor: COLORS.white, padding: 15, borderRadius: 12, flexDirection: "row", alignItems: "center", marginBottom: 10, borderLeftWidth: 4, borderLeftColor: COLORS.secondary, elevation: 2 },
  notificationIcon: { marginRight: 15 },
  notificationInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  lastPurchaseText: { fontSize: 14, color: COLORS.gray },
  whatsappButton: { padding: 5 },
  logoutButton: { position: "absolute", top: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20, right: 20, padding: 5 },
});