import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/theme";

export default function ClientsScreen() {
  // Estado para buscar clientes
  const [searchQuery, setSearchQuery] = useState("");

  // Estado para controlar el Modal (Pop-up)
  const [selectedClient, setSelectedClient] = useState(null);

  // Filtros
  const filters = ["Todos", "A-Z", "Fecha", "Alerta"];
  const [activeFilter, setActiveFilter] = useState("Todos");

  // Datos de prueba temporales
  const clientsData = [
    {
      id: "1",
      name: "Juan Cruz",
      phone: "2227795715",
      lastPurchase: "04/15/2026",
      alertDays: 15,
      history: [
        {
          id: "h1",
          date: "02/02/2026",
          type: "Grano",
          weight: "0.5",
          price: "165",
        },
        {
          id: "h2",
          date: "21/02/2026",
          type: "Molido",
          weight: "0.5",
          price: "165",
        },
        {
          id: "h3",
          date: "02/03/2026",
          type: "Expresso",
          weight: "1.00",
          price: "320",
        },
        {
          id: "h4",
          date: "02/02/2026",
          type: "Grano",
          weight: "0.5",
          price: "165",
        },
      ],
    },
    {
      id: "2",
      name: "María López",
      phone: "5512345678",
      lastPurchase: "04/10/2026",
      alertDays: 5,
      history: [],
    },
    {
      id: "3",
      name: "Carlos Ruíz",
      phone: "5587654321",
      lastPurchase: "03/25/2026",
      alertDays: 0,
      history: [],
    },
  ];

  // Función para abrir WhatsApp
  const openWhatsApp = (phone) => {
    // Usamos wa.me para que abra la app o el navegador si no está instalada
    const url = `https://wa.me/52${phone}`;
    Linking.openURL(url).catch(() => {
      alert("Asegúrate de tener WhatsApp instalado");
    });
  };

  // Renderiza cada tarjeta de cliente en la lista
  const renderClientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => setSelectedClient(item)} // Abre el popup al tocar
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
          Ultima compra: {item.lastPurchase}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.gray} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
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
          <Text style={styles.headerTitle}>Clientes</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* BUSCADOR Y FILTROS */}
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
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* LISTA DE CLIENTES */}
      <FlatList
        data={clientsData}
        keyExtractor={(item) => item.id}
        renderItem={renderClientItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* POPUP / MODAL DE DETALLE DE CLIENTE */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedClient !== null}
        onRequestClose={() => setSelectedClient(null)} // Botón atrás en Android
      >
        {/* Fondo oscuro transparente. Al tocarlo se cierra el modal */}
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedClient(null)}
        >
          {/* Tarjeta del Pop-up */}
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

            {/* Cabecera del Modal (Foto, Nombre, Alerta) */}
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

              {/* Etiqueta de Alerta Naranja */}
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>
                  Alerta en {selectedClient?.alertDays} dias
                </Text>
              </View>
            </View>

            {/* Historial de Compras */}
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Historial de Compras</Text>
              <View style={styles.historyList}>
                {selectedClient?.history.map((item, index) => (
                  <View key={item.id} style={styles.historyItem}>
                    <Text style={styles.historyText}>
                      [1] {item.date} - {item.type}
                    </Text>
                    <Text style={styles.historyWeight}>{item.weight} kg</Text>
                    <Text style={styles.historyPrice}>${item.price}</Text>
                  </View>
                ))}
                {selectedClient?.history.length === 0 && (
                  <Text
                    style={{
                      textAlign: "center",
                      color: COLORS.gray,
                      padding: 10,
                    }}
                  >
                    Sin compras recientes
                  </Text>
                )}
              </View>
            </View>

            {/* Botones de Acción */}
            <TouchableOpacity style={styles.reminderButton}>
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
              onPress={() => openWhatsApp(selectedClient?.phone)}
            >
              <Ionicons
                name="logo-whatsapp"
                size={24}
                color={COLORS.white}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.actionButtonText}>Enviar WhatsApp</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
//Estilos
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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

  // ESTILOS DEL MODAL (POP-UP)
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
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

  historyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  historyList: { borderTopWidth: 1, borderTopColor: "#EEE" },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  historyText: { flex: 2, fontSize: 12, color: COLORS.text },
  historyWeight: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    textAlign: "center",
  },
  historyPrice: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    textAlign: "right",
  },

  reminderButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 10,
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
});
