import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
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

  const [stock, setStock] = useState({
    grano: "0",
    molido: "0",
    expresso: "0",
  });
  const [loading, setLoading] = useState(true);

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("grano");
  const [actionType, setActionType] = useState("add");
  const [amountToChange, setAmountToChange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coffeeTypes = [
    { id: "grano", name: "Grano", icon: "leaf" },
    { id: "molido", name: "Molido", icon: "cafe" },
    { id: "expresso", name: "Expresso", icon: "color-fill" },
  ];

  const [investments, setInvestments] = useState([]);
  const [isInvModalVisible, setInvModalVisible] = useState(false);
  const [showNewInvForm, setShowNewInvForm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [invType, setInvType] = useState("Café");
  const [invAmount, setInvAmount] = useState("");
  const [invDate, setInvDate] = useState(new Date());
  const [showInvPicker, setShowInvPicker] = useState(false);
  const [isSavingInv, setIsSavingInv] = useState(false);

  const invTypesList = [
    { id: "Café", name: "Café", icon: "leaf" },
    { id: "Etiquetas", name: "Etiquetas", icon: "pricetag" },
    { id: "Envío", name: "Envío", icon: "bus" },
  ];

  const onChangeInvDate = (event, selectedDate) => {
    const currentDate = selectedDate || invDate;
    setShowInvPicker(Platform.OS === "ios");
    setInvDate(currentDate);
  };

  const formattedInvDate = invDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  useEffect(() => {
    if (!user) return;

    const stockRef = doc(db, "stock", user.uid);
    const unsubscribeStock = onSnapshot(stockRef, (docSnap) => {
      if (docSnap.exists()) {
        setStock(docSnap.data());
      } else {
        setDoc(stockRef, { grano: "0", molido: "0", expresso: "0" });
      }
      setLoading(false);
    });

    const qInv = query(collection(db, "investments"), where("userId", "==", user.uid));
    const unsubscribeInv = onSnapshot(qInv, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setInvestments(docs);
    });

    return () => {
      unsubscribeStock();
      unsubscribeInv();
    };
  }, [user]);

  const totalPages = Math.ceil(investments.length / itemsPerPage);
  const paginatedInvestments = investments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleConfirmStock = async () => {
    if (!amountToChange || parseFloat(amountToChange) <= 0) {
      Alert.alert("Atención", "Ingresa una cantidad válida mayor a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentAmount = parseFloat(stock[selectedType]) || 0;
      const changeAmount = parseFloat(amountToChange);
      let newAmount = actionType === "add" ? currentAmount + changeAmount : currentAmount - changeAmount;
      if (newAmount < 0) newAmount = 0;

      const stockRef = doc(db, "stock", user.uid);
      await setDoc(stockRef, {
        ...stock,
        [selectedType]: newAmount.toString(),
      });

      setAmountToChange("");
      setModalVisible(false);
      Alert.alert("Éxito", "Inventario actualizado.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar el inventario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveInvestment = async () => {
    if (!invAmount || parseFloat(invAmount) <= 0) {
      Alert.alert("Atención", "Ingresa un monto válido.");
      return;
    }

    setIsSavingInv(true);
    try {
      await addDoc(collection(db, "investments"), {
        userId: user.uid,
        type: invType,
        amount: parseFloat(invAmount),
        date: invDate.toISOString(),
        formattedDate: formattedInvDate,
        createdAt: new Date(),
      });

      setInvAmount("");
      setInvDate(new Date());
      setShowNewInvForm(false);
      setCurrentPage(1); 
      Alert.alert("Éxito", "Inversión registrada.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo registrar la inversión.");
    } finally {
      setIsSavingInv(false);
    }
  };

  const handleDeleteInvestment = (invId) => {
    Alert.alert(
      "Eliminar Inversión",
      "¿Estás seguro de que deseas eliminar este registro? Esta acción afectará el reporte final.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "investments", invId));
              if (paginatedInvestments.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
              }
            } catch (error) {
              console.error("Error al eliminar inversión: ", error);
              Alert.alert("Error", "No se pudo eliminar el registro.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20 }} />
        <Text style={styles.title}>Inventario de Café</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Tipo de Café</Text>
                <Text style={styles.tableHeaderText}>Cantidad (kg)</Text>
              </View>

              {coffeeTypes.map((coffee, index) => {
                const currentWeight = parseFloat(stock[coffee.id]) || 0;
                const isLowStock = currentWeight < 2.0;

                return (
                  <View key={coffee.id} style={[styles.tableRow, index === coffeeTypes.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.rowLeft}>
                      <View style={[styles.iconBox, { backgroundColor: isLowStock ? "#FFF3E0" : "#EFEBE9" }]}>
                        <Ionicons name={coffee.icon} size={20} color={isLowStock ? COLORS.secondary : COLORS.primary} />
                      </View>
                      <View>
                        <Text style={styles.rowName}>{coffee.name}</Text>
                        {isLowStock && <Text style={styles.lowStockText}>Stock Bajo</Text>}
                      </View>
                    </View>
                    <Text style={[styles.rowValue, isLowStock && { color: COLORS.secondary }]}>
                      {currentWeight} kg
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() => {
                  setAmountToChange("");
                  setModalVisible(true);
                }}
              >
                <Ionicons name="create-outline" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={styles.manageButtonText}>Gestionar Inventario</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.orderButton} 
                onPress={() => {
                  setShowNewInvForm(false); 
                  setInvModalVisible(true);
                }}
              >
                <Ionicons name="cash" size={24} color={COLORS.white} style={{ marginRight: 10 }} />
                <Text style={styles.orderButtonText}>Inversiones</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.gray} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Ajustar Inventario</Text>
              <Text style={styles.modalSubtitle}>1. Selecciona el tipo</Text>
              <View style={styles.typeSelector}>
                {coffeeTypes.map((coffee) => (
                  <TouchableOpacity
                    key={coffee.id}
                    style={[styles.typePill, selectedType === coffee.id && styles.typePillActive]}
                    onPress={() => setSelectedType(coffee.id)}
                  >
                    <Ionicons name={coffee.icon} size={18} color={selectedType === coffee.id ? COLORS.white : COLORS.gray} />
                    <Text style={[styles.typePillText, selectedType === coffee.id && styles.typePillTextActive]}>{coffee.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.currentStockBox}>
                <Text style={{ color: COLORS.gray }}>Stock actual en base de datos:</Text>
                <Text style={styles.currentStockNumber}>{stock[selectedType] || 0} kg</Text>
              </View>
              <Text style={styles.modalSubtitle}>2. ¿Qué deseas hacer?</Text>
              <View style={styles.actionSelector}>
                <TouchableOpacity style={[styles.actionBtn, actionType === "add" && styles.actionBtnAdd]} onPress={() => setActionType("add")}>
                  <Ionicons name="add-circle-outline" size={20} color={actionType === "add" ? COLORS.white : COLORS.success} />
                  <Text style={[styles.actionBtnText, { color: actionType === "add" ? COLORS.white : COLORS.success }]}>Añadir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, actionType === "subtract" && styles.actionBtnSubtract]} onPress={() => setActionType("subtract")}>
                  <Ionicons name="remove-circle-outline" size={20} color={actionType === "subtract" ? COLORS.white : COLORS.secondary} />
                  <Text style={[styles.actionBtnText, { color: actionType === "subtract" ? COLORS.white : COLORS.secondary }]}>Retirar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Cantidad (kg):</Text>
                <TextInput style={[styles.amountInput, { textAlign: "right", flex: 1 }]} keyboardType="decimal-pad" placeholder="Ej. 1.5" placeholderTextColor="#999999" value={amountToChange} onChangeText={(text) => setAmountToChange(text.replace(/[^0-9.]/g, ""))} />
              </View>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmStock} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.confirmButtonText}>Confirmar Actualización</Text>}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={isInvModalVisible} onRequestClose={() => setInvModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <Pressable style={styles.centeredModalOverlay} onPress={() => setInvModalVisible(false)}>
            <Pressable style={styles.centeredModalCard} onPress={(e) => e.stopPropagation()}>
              
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setInvModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.gray} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Historial de Inversiones</Text>

              {!showNewInvForm ? (
                <>
                  <TouchableOpacity style={styles.newInvButton} onPress={() => setShowNewInvForm(true)}>
                    <Ionicons name="add-circle" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.newInvButtonText}>Registrar Inversión</Text>
                  </TouchableOpacity>

                  <View style={styles.invTableContainer}>
                    <View style={styles.invTableHeader}>
                      <Text style={[styles.invHeaderText, { flex: 1.5 }]}>Fecha</Text>
                      <Text style={[styles.invHeaderText, { flex: 1.5 }]}>Tipo</Text>
                      <Text style={[styles.invHeaderText, { flex: 1.2, textAlign: "right" }]}>Monto</Text>
                      <View style={{ width: 35 }} />
                    </View>
                    
                    <View style={{ minHeight: 250 }}>
                      {investments.length === 0 ? (
                        <Text style={{ textAlign: "center", marginTop: 40, color: COLORS.gray, fontStyle: "italic" }}>
                          No hay inversiones registradas.
                        </Text>
                      ) : (
                        paginatedInvestments.map((inv) => (
                          <View key={inv.id} style={styles.invTableRow}>
                            <Text style={[styles.invRowText, { flex: 1.5, fontSize: 12 }]}>{inv.formattedDate}</Text>
                            <Text style={[styles.invRowText, { flex: 1.5, fontWeight: "bold" }]}>{inv.type}</Text>
                            <Text style={[styles.invRowText, { flex: 1.2, textAlign: "right", color: COLORS.secondary, fontWeight: "bold" }]}>
                              ${inv.amount}
                            </Text>
                            
                            <TouchableOpacity 
                              style={{ width: 35, alignItems: "flex-end", justifyContent: "center" }}
                              onPress={() => handleDeleteInvestment(inv.id)}
                            >
                              <Ionicons name="trash-outline" size={20} color="#E53935" />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>

                    {investments.length > itemsPerPage && (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity onPress={handlePrevPage} disabled={currentPage === 1}>
                          <Ionicons name="chevron-back" size={24} color={currentPage === 1 ? "#CCC" : COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.paginationText}>
                          Pág {currentPage} de {totalPages}
                        </Text>
                        <TouchableOpacity onPress={handleNextPage} disabled={currentPage === totalPages}>
                          <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages ? "#CCC" : COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }} onPress={() => setShowNewInvForm(false)}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
                    <Text style={{ color: COLORS.primary, marginLeft: 5, fontWeight: "bold" }}>Volver a la lista</Text>
                  </TouchableOpacity>

                  <Text style={styles.modalSubtitle}>1. Tipo de Inversión</Text>
                  <View style={styles.typeSelector}>
                    {invTypesList.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[styles.typePill, invType === type.id && styles.typePillActive]}
                        onPress={() => setInvType(type.id)}
                      >
                        <Ionicons name={type.icon} size={18} color={invType === type.id ? COLORS.white : COLORS.gray} />
                        <Text style={[styles.typePillText, invType === type.id && styles.typePillTextActive]}>{type.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.modalSubtitle}>2. Fecha</Text>
                  <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setShowInvPicker(true)}>
                    <Ionicons name="calendar" size={20} color={COLORS.gray} style={{ marginRight: 10 }} />
                    <Text style={styles.inputText}>{formattedInvDate}</Text>
                  </TouchableOpacity>

                  {showInvPicker && (
                    <DateTimePicker value={invDate} mode="date" display="default" onChange={onChangeInvDate} />
                  )}

                  <Text style={styles.modalSubtitle}>3. Monto Invertido ($)</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      style={[styles.amountInput, { textAlign: "left", flex: 1 }]}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#999999"
                      value={invAmount}
                      onChangeText={(text) => setInvAmount(text.replace(/[^0-9.]/g, ""))}
                    />
                  </View>

                  <TouchableOpacity style={styles.confirmButton} onPress={handleSaveInvestment} disabled={isSavingInv}>
                    {isSavingInv ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.confirmButtonText}>Guardar Inversión</Text>}
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.white },
  scrollContent: { padding: 20, paddingBottom: 40 },

  tableCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 15, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 30 },
  tableHeader: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: "#F0F0F0", paddingBottom: 10, marginBottom: 10 },
  tableHeaderText: { color: COLORS.gray, fontWeight: "bold", fontSize: 14 },
  tableRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 15 },
  rowName: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  lowStockText: { fontSize: 12, color: COLORS.secondary, fontWeight: "bold", marginTop: 2 },
  rowValue: { fontSize: 18, fontWeight: "bold", color: COLORS.primary },

  actionButtonsContainer: { gap: 15 },
  manageButton: { backgroundColor: "transparent", borderWidth: 2, borderColor: COLORS.primary, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, borderRadius: 15 },
  manageButtonText: { color: COLORS.primary, fontSize: 18, fontWeight: "bold" },
  orderButton: { backgroundColor: COLORS.secondary, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, borderRadius: 15, elevation: 4 },
  orderButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, elevation: 10 },
  
  centeredModalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "center", padding: 12 }, 
  centeredModalCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, elevation: 10, width: "100%", minHeight: 450 },

  closeModalButton: { position: "absolute", top: 15, right: 15, zIndex: 10, padding: 5 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.primary, textAlign: "center", marginBottom: 20 },
  modalSubtitle: { fontSize: 14, fontWeight: "bold", color: COLORS.gray, marginBottom: 10, marginTop: 10 },

  typeSelector: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  typePill: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#F0F0F0", paddingVertical: 10, borderRadius: 12, marginHorizontal: 4 },
  typePillActive: { backgroundColor: COLORS.primary },
  typePillText: { marginLeft: 5, fontSize: 12, fontWeight: "bold", color: COLORS.gray },
  typePillTextActive: { color: COLORS.white },

  currentStockBox: { backgroundColor: "#F9F9F9", padding: 15, borderRadius: 12, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#EEE" },
  currentStockNumber: { fontSize: 24, fontWeight: "bold", color: COLORS.primary, marginTop: 5 },

  actionSelector: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 2, marginHorizontal: 5, borderColor: "#EEE" },
  actionBtnAdd: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  actionBtnSubtract: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  actionBtnText: { marginLeft: 5, fontWeight: "bold", fontSize: 16 },

  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 15, paddingHorizontal: 20, height: 55, marginBottom: 25 },
  inputLabel: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  amountInput: { fontSize: 24, fontWeight: "bold", color: COLORS.primary, minWidth: 100 },
  
  dateInputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F5F5", borderRadius: 15, paddingHorizontal: 20, height: 55, marginBottom: 15 },
  inputText: { fontSize: 16, color: COLORS.text, flex: 1 },
  currencyPrefix: { fontSize: 24, fontWeight: "bold", color: COLORS.secondary, marginRight: 5 },

  confirmButton: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 15, alignItems: "center", elevation: 2 },
  confirmButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },

  newInvButton: { backgroundColor: COLORS.success, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 12, borderRadius: 12, marginBottom: 15 },
  newInvButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  invTableContainer: { backgroundColor: "#F9F9F9", borderRadius: 12, borderWidth: 1, borderColor: "#EEE", overflow: "hidden" },
  invTableHeader: { flexDirection: "row", backgroundColor: "#E0E0E0", padding: 12, borderBottomWidth: 1, borderBottomColor: "#CCC" },
  invHeaderText: { fontWeight: "bold", color: COLORS.text, fontSize: 12 },
  invTableRow: { flexDirection: "row", padding: 12, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  invRowText: { color: COLORS.text, fontSize: 14 },
  paginationContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderTopWidth: 1, borderTopColor: "#EEE", backgroundColor: COLORS.white },
  paginationText: { fontSize: 12, color: COLORS.gray, fontWeight: "bold" },
});