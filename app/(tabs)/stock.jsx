import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

export default function StockScreen() {
  const { user } = useAuth();

  // ESTADO DEL INVENTARIO (Desde Firebase)
  const [stock, setStock] = useState({
    grano: "0",
    molido: "0",
    expresso: "0",
  });
  const [loading, setLoading] = useState(true);

  // ESTADOS DEL MODAL DE GESTIÓN
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("grano"); // grano, molido, expresso
  const [actionType, setActionType] = useState("add"); // add o subtract
  const [amountToChange, setAmountToChange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones de café para la UI
  const coffeeTypes = [
    { id: "grano", name: "Grano", icon: "leaf" },
    { id: "molido", name: "Molido", icon: "cafe" },
    { id: "expresso", name: "Expresso", icon: "color-fill" },
  ];

  // ESCUCHAR EL INVENTARIO EN FIREBASE EN TIEMPO REAL
  useEffect(() => {
    if (!user) return;

    const stockRef = doc(db, "stock", user.uid);

    const unsubscribe = onSnapshot(stockRef, (docSnap) => {
      if (docSnap.exists()) {
        setStock(docSnap.data());
      } else {
        // Si el usuario es nuevo y no tiene stock, le creamos su documento en 0
        setDoc(stockRef, { grano: "0", molido: "0", expresso: "0" });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // FUNCIÓN PARA GUARDAR EN FIREBASE (AL CONFIRMAR EL MODAL)
  const handleConfirmStock = async () => {
    if (!amountToChange || parseFloat(amountToChange) <= 0) {
      Alert.alert("Atención", "Ingresa una cantidad válida mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentAmount = parseFloat(stock[selectedType]) || 0;
      const changeAmount = parseFloat(amountToChange);

      let newAmount =
        actionType === "add"
          ? currentAmount + changeAmount
          : currentAmount - changeAmount;

      // Evitamos que el stock quede en números negativos
      if (newAmount < 0) newAmount = 0;

      const stockRef = doc(db, "stock", user.uid);
      await setDoc(stockRef, {
        ...stock,
        [selectedType]: newAmount.toString(), // Guardamos en Firebase el nuevo total
      });

      // Limpiamos y cerramos modal
      setAmountToChange("");
      setModalVisible(false);
      Alert.alert("Éxito", "Inventario actualizado correctamente.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar el inventario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER CURVO */}
      <View style={styles.header}>
        <View
          style={{
            height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20,
          }}
        />
        <Text style={styles.title}>Inventario de Café</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            {/* TABLA DE RESUMEN */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Tipo de Café</Text>
                <Text style={styles.tableHeaderText}>Cantidad (kg)</Text>
              </View>

              {coffeeTypes.map((coffee, index) => {
                const currentWeight = parseFloat(stock[coffee.id]) || 0;
                const isLowStock = currentWeight < 2.0; // Alerta si hay menos de 2kg

                return (
                  <View
                    key={coffee.id}
                    style={[
                      styles.tableRow,
                      index === coffeeTypes.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: isLowStock ? "#FFF3E0" : "#EFEBE9",
                          },
                        ]}
                      >
                        <Ionicons
                          name={coffee.icon}
                          size={20}
                          color={isLowStock ? COLORS.secondary : COLORS.primary}
                        />
                      </View>
                      <View>
                        <Text style={styles.rowName}>{coffee.name}</Text>
                        {isLowStock && (
                          <Text style={styles.lowStockText}>Stock Bajo</Text>
                        )}
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.rowValue,
                        isLowStock && { color: COLORS.secondary },
                      ]}
                    >
                      {currentWeight} kg
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* BOTONES DE ACCIÓN */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => {
                  setAmountToChange("");
                  setModalVisible(true);
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={24}
                  color={COLORS.primary}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.manageButtonText}>
                  Gestionar Inventario
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.orderButton}>
                <Ionicons
                  name="mail"
                  size={24}
                  color={COLORS.white}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.orderButtonText}>Hacer Pedido</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* MODAL DE GESTIÓN DE INVENTARIO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <Pressable
              style={styles.modalCard}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={28} color={COLORS.gray} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Ajustar Inventario</Text>

              {/* SELECTOR DE CAFÉ */}
              <Text style={styles.modalSubtitle}>1. Selecciona el tipo</Text>
              <View style={styles.typeSelector}>
                {coffeeTypes.map((coffee) => (
                  <TouchableOpacity
                    key={coffee.id}
                    style={[
                      styles.typePill,
                      selectedType === coffee.id && styles.typePillActive,
                    ]}
                    onPress={() => setSelectedType(coffee.id)}
                  >
                    <Ionicons
                      name={coffee.icon}
                      size={18}
                      color={
                        selectedType === coffee.id ? COLORS.white : COLORS.gray
                      }
                    />
                    <Text
                      style={[
                        styles.typePillText,
                        selectedType === coffee.id && styles.typePillTextActive,
                      ]}
                    >
                      {coffee.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* MOSTRAR STOCK ACTUAL (CONGELADO) */}
              <View style={styles.currentStockBox}>
                <Text style={{ color: COLORS.gray }}>
                  Stock actual en base de datos:
                </Text>
                <Text style={styles.currentStockNumber}>
                  {stock[selectedType] || 0} kg
                </Text>
              </View>

              {/* AÑADIR O RETIRAR (TOGGLE) */}
              <Text style={styles.modalSubtitle}>2. ¿Qué deseas hacer?</Text>
              <View style={styles.actionSelector}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    actionType === "add" && styles.actionBtnAdd,
                  ]}
                  onPress={() => setActionType("add")}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={actionType === "add" ? COLORS.white : COLORS.success}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      {
                        color:
                          actionType === "add" ? COLORS.white : COLORS.success,
                      },
                    ]}
                  >
                    Añadir
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    actionType === "subtract" && styles.actionBtnSubtract,
                  ]}
                  onPress={() => setActionType("subtract")}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={20}
                    color={
                      actionType === "subtract"
                        ? COLORS.white
                        : COLORS.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      {
                        color:
                          actionType === "subtract"
                            ? COLORS.white
                            : COLORS.secondary,
                      },
                    ]}
                  >
                    Retirar
                  </Text>
                </TouchableOpacity>
              </View>

              {/* INPUT DE CANTIDAD */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Cantidad (kg):</Text>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="decimal-pad"
                  placeholder="Ej. 1.5"
                  value={amountToChange}
                  onChangeText={(text) =>
                    setAmountToChange(text.replace(/[^0-9.]/g, ""))
                  }
                />
              </View>

              {/* BOTÓN CONFIRMAR */}
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmStock}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Confirmar Actualización
                  </Text>
                )}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.white },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // TABLA VISUAL
  tableCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 10,
    marginBottom: 10,
  },
  tableHeaderText: { color: COLORS.gray, fontWeight: "bold", fontSize: 14 },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  rowName: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  lowStockText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "bold",
    marginTop: 2,
  },
  rowValue: { fontSize: 18, fontWeight: "bold", color: COLORS.primary },

  // BOTONES INFERIORES
  actionButtonsContainer: { gap: 15 },
  manageButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 15,
  },
  manageButtonText: { color: COLORS.primary, fontSize: 18, fontWeight: "bold" },
  orderButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 15,
    elevation: 4,
  },
  orderButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  }, // Aparece desde abajo
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
    elevation: 10,
  },
  closeModalButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.gray,
    marginBottom: 10,
  },

  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  typePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  typePillActive: { backgroundColor: COLORS.primary },
  typePillText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.gray,
  },
  typePillTextActive: { color: COLORS.white },

  currentStockBox: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  currentStockNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 5,
  },

  actionSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 5,
    borderColor: "#EEE",
  },
  actionBtnAdd: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  actionBtnSubtract: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  actionBtnText: { marginLeft: 5, fontWeight: "bold", fontSize: 16 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 25,
  },
  inputLabel: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  amountInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "right",
    minWidth: 100,
  },

  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 2,
  },
  confirmButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
});
