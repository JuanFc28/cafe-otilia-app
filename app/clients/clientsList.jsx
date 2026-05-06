import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, Stack } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";

export default function ClientsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  const filters = ["Todos", "A-Z", "Fecha", "Alerta"];
  const [activeFilter, setActiveFilter] = useState("Todos");

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [activeQuickDate, setActiveQuickDate] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "clients"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClients(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // FUNCIÓN WHATSAPP CON MENSAJE PRECARGADO
  const openWhatsApp = (phone, name) => {
    const message = `¡Hola ${name}! 👋🏼 Le escribo de Café Otilia. ¿Qué tal le pareció su último café? ☕ Esperamos que lo esté disfrutando mucho. ¿Le gustaría que le agendemos un nuevo pedido?`;
    const url = `https://wa.me/52${phone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() =>
      alert("Asegúrate de tener WhatsApp instalado"),
    );
  };

  // FUNCIÓN PARA ELIMINAR CLIENTE
  const handleDeleteClient = (clientId, clientName) => {
    Alert.alert(
      "Eliminar Cliente",
      `¿Estás seguro de que deseas eliminar a ${clientName}? Esta acción borrará todo su historial y no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "clients", clientId));
              setSelectedClient(null);
              Alert.alert("Éxito", "Cliente eliminado correctamente.");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "No se pudo eliminar el cliente.");
            }
          },
        },
      ],
    );
  };

  const setQuickDate = (days) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    setReminderDate(newDate);
    setActiveQuickDate(days);
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || reminderDate;
    setShowDatePicker(Platform.OS === "ios");
    setReminderDate(currentDate);
    setActiveQuickDate(null);
  };

  const handleSaveReminder = async () => {
    if (!selectedClient) return;
    setIsUpdatingReminder(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(reminderDate);
      target.setHours(0, 0, 0, 0);

      const diffTime = target - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const finalDays = diffDays >= 0 ? diffDays : 0;

      await updateDoc(doc(db, "clients", selectedClient.id), {
        alertDays: finalDays,
        isNotified: false
      });

      setSelectedClient({ ...selectedClient, alertDays: finalDays, isNotified: false });
      setReminderModalVisible(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  // LÓGICA DE FILTRADO CORREGIDA
  const filteredClients = clients
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeFilter === "Alerta") {
        return matchesSearch && !c.isNotified;
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      if (activeFilter === "A-Z") return a.name.localeCompare(b.name);
      if (activeFilter === "Alerta")
        return (a.alertDays || 0) - (b.alertDays || 0);
      if (activeFilter === "Fecha") {
        const parseDate = (dateStr) => {
          if (!dateStr) return 0;
          const parts = dateStr.split("/");
          return parts.length === 3
            ? new Date(parts[2], parts[1] - 1, parts[0]).getTime()
            : 0;
        };
        return parseDate(b.lastPurchase) - parseDate(a.lastPurchase);
      }
      return 0;
    });

  const renderClientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => setSelectedClient(item)}
    >
      <View style={styles.clientIconBox}>
        <Ionicons
          name="person-circle-outline"
          size={40}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <View style={styles.phoneRow}>
          <Ionicons name="call" size={14} color={COLORS.gray} />
          <Text style={styles.clientPhone}>{item.phone}</Text>
        </View>
        <Text style={styles.lastPurchase}>
          Última compra: {item.lastPurchase}
        </Text>
      </View>

      <View style={styles.rightActionContainer}>
        <View style={[
          styles.listAlertBadgeRight, 
          item.isNotified && { backgroundColor: COLORS.success } // <--- Se pone verde
        ]}>
          <Text style={styles.listAlertBadgeText}>
            {item.isNotified ? "Notificado" : `${item.alertDays} d`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View
          style={{
            height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
          }}
        />
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Clientes</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>Buscador de Clientes</Text>
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.gray}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filtersContainer}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                activeFilter === f && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id}
          renderItem={renderClientItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: COLORS.gray }}>
              Sin resultados.
            </Text>
          }
        />
      )}

      {/* MODAL DETALLE */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedClient !== null}
        onRequestClose={() => setSelectedClient(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedClient(null)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setSelectedClient(null)}
            >
              <Ionicons name="close" size={28} color={COLORS.gray} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons
                  name="person-circle-outline"
                  size={50}
                  color={COLORS.text}
                />
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalClientName}>
                    {selectedClient?.name}
                  </Text>
                  <View style={styles.phoneRow}>
                    <Ionicons name="call" size={14} color={COLORS.text} />
                    <Text style={styles.modalClientPhone}>
                      {selectedClient?.phone}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.alertBadge, selectedClient?.isNotified && { backgroundColor: COLORS.success}}>
                <Text style={styles.alertBadgeText}>
                  {selectedClient?.isNotified ? "Notificado" : `Alerta en ${selectedClient?.alertDays} días`}
                </Text>
              </View>
            </View>

            {/* NUEVO: SECCIÓN DE NOTAS */}
            {selectedClient?.latestNote ? (
              <View style={styles.notesContainer}>
                <Text style={styles.notesTitle}>Notas del cliente:</Text>
                <Text style={styles.notesText}>{selectedClient.latestNote}</Text>
              </View>
            ) : null}

            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Historial de Compras</Text>
              <ScrollView
                style={{
                  maxHeight: 180,
                  borderTopWidth: 1,
                  borderTopColor: "#EEE",
                }}
              >
                {selectedClient?.history?.map((h, i) => (
                  <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyText}>
                      {h.date} - {h.type}
                    </Text>
                    <Text style={styles.historyWeight}>{h.weight} kg</Text>
                    <Text style={styles.historyPrice}>${h.price}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={styles.reminderButton}
                onPress={() => setReminderModalVisible(true)}
              >
                <Ionicons
                  name="notifications"
                  size={24}
                  color={COLORS.white}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.actionButtonText}>
                  Establecer Recordatorio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() =>
                  openWhatsApp(selectedClient?.phone, selectedClient?.name)
                }
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={24}
                  color={COLORS.white}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.actionButtonText}>Enviar WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() =>
                  handleDeleteClient(selectedClient?.id, selectedClient?.name)
                }
              >
                <Ionicons
                  name="trash"
                  size={20}
                  color={COLORS.secondary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.deleteButtonText}>Eliminar Cliente</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL RECORDATORIO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reminderModalVisible}
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setReminderModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalClientName}>Nuevo Recordatorio</Text>
            <View style={styles.quickDatesContainer}>
              <TouchableOpacity
                style={[
                  styles.quickDateButton,
                  activeQuickDate === 7 && styles.quickDateButtonActive,
                ]}
                onPress={() => setQuickDate(7)}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    activeQuickDate === 7 && styles.quickDateTextActive,
                  ]}
                >
                  1 Sem
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quickDateButton,
                  activeQuickDate === 15 && styles.quickDateButtonActive,
                ]}
                onPress={() => setQuickDate(15)}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    activeQuickDate === 15 && styles.quickDateTextActive,
                  ]}
                >
                  15 Días
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quickDateButton,
                  activeQuickDate === 30 && styles.quickDateButtonActive,
                ]}
                onPress={() => setQuickDate(30)}
              >
                <Text
                  style={[
                    styles.quickDateText,
                    activeQuickDate === 30 && styles.quickDateTextActive,
                  ]}
                >
                  1 Mes
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar"
                size={20}
                color={COLORS.primary}
                style={{ marginRight: 10 }}
              />
              <Text>
                {reminderDate.toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={reminderDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={onChangeDate}
              />
            )}

            <TouchableOpacity
              style={[styles.whatsappButton, { marginTop: 20 }]}
              onPress={handleSaveReminder}
              disabled={isUpdatingReminder}
            >
              {isUpdatingReminder ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.actionButtonText}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: "bold" },
  backButton: { padding: 5 },
  searchSection: { padding: 20 },
  searchLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  filterPillActive: { backgroundColor: COLORS.secondary },
  filterText: { color: COLORS.gray, fontWeight: "bold", fontSize: 12 },
  filterTextActive: { color: COLORS.white },
  listContent: { padding: 20, paddingBottom: 100 },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  clientIconBox: { marginRight: 15 },
  clientInfo: { flex: 1 },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  phoneRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  clientPhone: { fontSize: 14, color: COLORS.gray, marginLeft: 5 },
  lastPurchase: { fontSize: 12, color: COLORS.gray },

  // ESTILOS DE LA NUEVA ALERTA A LA DERECHA
  rightActionContainer: { flexDirection: "row", alignItems: "center" },
  listAlertBadgeRight: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 5,
  },
  listAlertBadgeText: { color: COLORS.white, fontWeight: "bold", fontSize: 10 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  closeModalButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 15,
  },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center" },
  modalHeaderInfo: { marginLeft: 10 },
  modalClientName: { fontSize: 18, fontWeight: "bold", color: COLORS.text },
  modalClientPhone: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 5,
  },
  alertBadge: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  alertBadgeText: { color: COLORS.white, fontWeight: "bold", fontSize: 12 },
  notesContainer: {
    backgroundColor: "#FFF9C4", // Amarillo tenue tipo "post-it"
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#FBC02D",
  },
  notesTitle: { fontWeight: "bold", color: "#F57F17", marginBottom: 2, fontSize: 12 },
  notesText: { color: COLORS.text, fontSize: 14, fontStyle: "italic" },
  historyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  historyTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  historyText: { flex: 2, fontSize: 12, color: COLORS.text },
  historyWeight: { flex: 1, fontSize: 12, textAlign: "center" },
  historyPrice: { flex: 1, fontSize: 12, textAlign: "right" },
  reminderButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 25,
  },
  whatsappButton: {
    backgroundColor: COLORS.success,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 25,
  },
  actionButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 5,
  },
  deleteButtonText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "bold",
  },
  quickDatesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  quickDateButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  quickDateButtonActive: { backgroundColor: COLORS.secondary },
  quickDateText: { color: COLORS.gray, fontWeight: "bold" },
  quickDateTextActive: { color: COLORS.white },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
});
