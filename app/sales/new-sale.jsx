import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, Stack } from "expo-router";
import {
  addDoc,
  collection,
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
  KeyboardAvoidingView,
  Platform,
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

//Definicion de constantes
export default function NewSaleScreen() {
  const { user } = useAuth();

  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [coffeeType, setCoffeeType] = useState("Grano");
  const [quantity, setQuantity] = useState("1");
  const [total, setTotal] = useState("320");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESTADOS PARA AUTOCOMPLETADO Y STOCK
  const [clientsDb, setClientsDb] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentStock, setCurrentStock] = useState({
    grano: "0",
    molido: "0",
    expresso: "0",
  });

  // CALENDARIO
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const formattedDate = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const coffeeOptions = [
    { id: "Grano", icon: "leaf" },
    { id: "Molido", icon: "cafe" },
    { id: "Expresso", icon: "color-fill" },
  ];

  // CARGAR CLIENTES Y STOCK EN TIEMPO REAL
  useEffect(() => {
    if (!user) return;

    // Traer clientes para el autocompletado
    const qClients = query(
      collection(db, "clients"),
      where("userId", "==", user.uid),
    );
    const unsubClients = onSnapshot(qClients, (snapshot) => {
      setClientsDb(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Traer stock para la validación
    const unsubStock = onSnapshot(doc(db, "stock", user.uid), (docSnap) => {
      if (docSnap.exists()) setCurrentStock(docSnap.data());
    });

    return () => {
      unsubClients();
      unsubStock();
    };
  }, [user]);

  // LÓGICA DE PRECIOS AUTOMÁTICOS
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    let calculatedPrice = 0;

    const kilos = Math.floor(qty); // Kilos enteros
    const remainder = qty - kilos; // Decimales (0.25, 0.50, 0.75)

    calculatedPrice += kilos * 320;

    if (remainder === 0.25) calculatedPrice += 85;
    else if (remainder === 0.5) calculatedPrice += 165;
    else if (remainder === 0.75)
      calculatedPrice += 250; // 165 + 85
    else calculatedPrice += remainder * 320; // Fallback por si se escribe "0.3" a mano

    setTotal(calculatedPrice.toString());
  }, [quantity]);

  // FILTRO DE AUTOCOMPLETADO
  const filteredClients = clientName
    ? clientsDb.filter(
        (c) =>
          c.name.toLowerCase().includes(clientName.toLowerCase()) &&
          c.name.toLowerCase() !== clientName.toLowerCase(), // Ocultar si ya escribió el nombre completo exacto
      )
    : [];

  // REGISTRO DE VENTA Y DESCUENTO DE STOCK
 const handleRegisterSale = async () => {
    if (!clientName.trim() || !phone.trim() || !quantity || !total) {
      Alert.alert("Error", "Por favor llena todos los campos obligatorios.");
      return;
    }

    // VALIDACIÓN DE CLIENTE Y TELÉFONO ▼▼▼
    const nameToCheck = clientName.trim().toLowerCase();
    const phoneToCheck = phone.trim();

    // Buscamos si ya hay alguien con ese mismo nombre o ese mismo teléfono
    const existingByName = clientsDb.find((c) => c.name.toLowerCase() === nameToCheck);
    const existingByPhone = clientsDb.find((c) => c.phone === phoneToCheck);

    //El nombre ya existe, pero el teléfono es diferente
    if (existingByName && existingByName.phone !== phoneToCheck) {
      Alert.alert(
        "Datos Inconsistentes",
        `El cliente "${existingByName.name}" ya está registrado con el número ${existingByName.phone}.`
      );
      return; // Detiene el registro
    }

    //El teléfono ya existe, pero el nombre es diferente
    if (existingByPhone && existingByPhone.name.toLowerCase() !== nameToCheck) {
      Alert.alert(
        "Número Ocupado",
        `El número ${phoneToCheck} le pertenece a "${existingByPhone.name}". Verifica a quién le estás vendiendo.`
      );
      return; // Detiene el registro
    }

    // Validación de Inventario
    const coffeeKey = coffeeType.toLowerCase();
    const availableStock = parseFloat(currentStock[coffeeKey]) || 0;
    const requestedQty = parseFloat(quantity) || 0;

    if (availableStock < requestedQty) {
      Alert.alert(
        "Stock Insuficiente",
        `Solo tienes ${availableStock} kg de café ${coffeeType}. No puedes vender ${requestedQty} kg.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Guardar la Venta
      const saleRef = await addDoc(collection(db, "sales"), {
        userId: user.uid,
        clientName,
        phone,
        notes,
        coffeeType,
        quantity: requestedQty,
        total: parseFloat(total),
        date: date.toISOString(),
        formattedDate,
        createdAt: new Date(),
      });

      // Lógica del Cliente (Buscar si existe o crear nuevo)
      const existingClient = clientsDb.find((c) => c.phone === phone);
      const purchaseHistory = {
        id: saleRef.id,
        date: formattedDate,
        type: coffeeType,
        weight: requestedQty,
        price: total,
      };

      if (existingClient) {
        const existingHistory = existingClient.history || [];
        await updateDoc(doc(db, "clients", existingClient.id), {
          name: clientName,
          lastPurchase: formattedDate,
          latestNote: notes,
          isNotified: false,
          alertDays: 30,
          history: [purchaseHistory, ...existingHistory],
        });
      } else {
        await addDoc(collection(db, "clients"), {
          userId: user.uid,
          name: clientName,
          phone: phone,
          lastPurchase: formattedDate,
          latestNote: notes,
          alertDays: 30, // Recordatorio por defecto de 1 mes
          isNotified: false,
          history: [purchaseHistory],
        });
      }

      // Descontar del Inventario (Stock)
      await updateDoc(doc(db, "stock", user.uid), {
        [coffeeKey]: (availableStock - requestedQty).toString(),
      });

      Alert.alert(
        "Éxito",
        "Venta registrada y stock actualizado correctamente.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      Alert.alert("Error", "Hubo un problema al guardar los datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
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
          <Text style={styles.headerTitle}>Registrar Nueva Venta</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* NOMBRE DEL CLIENTE (CON AUTOCOMPLETADO) */}
        <View style={[styles.inputGroup, { zIndex: 10 }]}>
          <Text style={styles.label}>Nombre del Cliente</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person"
              size={20}
              color={COLORS.gray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ej. Alejo Cruz"
              placeholderTextColor="#999999"
              value={clientName}
              onChangeText={(text) => {
                setClientName(text);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
          </View>

          {/* LISTA DESPLEGABLE DE CLIENTES */}
          {showDropdown && filteredClients.length > 0 && (
            <View style={styles.dropdownContainer}>
              {filteredClients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setClientName(client.name);
                    setPhone(client.phone);
                    setNotes(client.latestNote || "");
                    setShowDropdown(false);
                  }}
                >
                  <Ionicons
                    name="person-circle"
                    size={24}
                    color={COLORS.primary}
                    style={{ marginRight: 10 }}
                  />
                  <View>
                    <Text style={styles.dropdownName}>{client.name}</Text>
                    <Text style={styles.dropdownPhone}>{client.phone}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono de Contacto</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="call"
              size={20}
              color={COLORS.gray}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ej. 2222064814"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        {/* NUEVO CAMPO: NOTAS */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notas (Opcional)</Text>
          <View style={[styles.inputWrapper, { height: 80, alignItems: 'flex-start', paddingTop: 10 }]}>
            <Ionicons name="document-text" size={20} color={COLORS.gray} style={styles.inputIcon, { marginTop: 2 }} />
            <TextInput
              style={[
                styles.input, 
                { 
                  textAlignVertical: 'top', 
                  paddingTop: 0,     
                  paddingBottom: 0,  
                  height: '100%'     
                }
              ]}
              placeholder="Dirección, referencias, detalles..."
              placeholderTextColor="#999999"
              multiline={true}
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        <Text style={styles.label}>Tipo de Café</Text>
        <View style={styles.coffeeToggleContainer}>
          {coffeeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.coffeeOption,
                coffeeType === option.id && styles.coffeeOptionActive,
              ]}
              onPress={() => setCoffeeType(option.id)}
            >
              <Ionicons
                name={option.icon}
                size={24}
                color={coffeeType === option.id ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.coffeeOptionText,
                  coffeeType === option.id && styles.coffeeOptionTextActive,
                ]}
              >
                {option.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cantidad (Kg)</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setQuantity(
                  Math.max(0, parseFloat(quantity || 0) - 0.25).toString(),
                )
              }
            >
              <Ionicons name="remove" size={30} color={COLORS.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.stepperInput}
              keyboardType="decimal-pad"
              value={quantity}
              onChangeText={setQuantity}
            />
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() =>
                setQuantity((parseFloat(quantity || 0) + 0.25).toString())
              }
            >
              <Ionicons name="add" size={30} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha de Venta</Text>
          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={COLORS.gray}
              style={styles.inputIcon}
            />
            <Text style={styles.inputText}>{formattedDate}</Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Monto Total ($)</Text>
          <View
            style={[
              styles.inputWrapper,
              { borderColor: COLORS.success, borderWidth: 2 },
            ]}
          >
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={[
                styles.input,
                { fontWeight: "bold", color: COLORS.success },
              ]}
              keyboardType="decimal-pad"
              value={total}
              onChangeText={setTotal}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleRegisterSale}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={COLORS.white}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.submitButtonText}>Registrar Venta</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ESTILOS
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
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  backButton: { padding: 5 },
  scrollContent: { padding: 20, paddingBottom: 50 },

  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.text },
  inputText: { flex: 1, fontSize: 16, color: COLORS.text },

  // ESTILOS DEL AUTOCOMPLETADO
  dropdownContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    marginTop: 5,
    maxHeight: 150,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { height: 2, width: 0 },
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  dropdownName: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  dropdownPhone: { fontSize: 12, color: COLORS.gray },

  coffeeToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  coffeeOption: {
    flex: 1,
    backgroundColor: COLORS.white,
    marginHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  coffeeOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  coffeeOptionText: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  coffeeOptionTextActive: { color: COLORS.white },

  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 5,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  stepperButton: {
    width: 60,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    padding: 0,
  },

  currencyPrefix: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.success,
    marginRight: 5,
  },
  submitButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 15,
    marginTop: 10,
    elevation: 4,
  },
  submitButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
});
