import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
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
// 1. Importamos Stack para poder ocultar el header feo desde aquí
import { router, Stack } from "expo-router";
import { COLORS } from "../../constants/theme";
// 2. Importamos el componente de Calendario
import DateTimePicker from "@react-native-community/datetimepicker";

export default function NewSaleScreen() {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [coffeeType, setCoffeeType] = useState("Grano");
  const [quantity, setQuantity] = useState("1");
  const [total, setTotal] = useState("150.00");

  // --- LÓGICA DEL CALENDARIO ---
  // Inicializa automáticamente con la fecha y hora de HOY
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    // En Android cerramos el calendario al elegir; en iOS lo maneja distinto
    setShowPicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  // Le damos formato visual (ej. 16/04/2026) para que tu papá lo vea claro
  const formattedDate = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  // ------------------------------

  const coffeeOptions = [
    { id: "Grano", icon: "leaf" },
    { id: "Molido", icon: "cafe" },
    { id: "Expresso", icon: "color-fill" },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* MAGIA: Esto apaga el header predeterminado "sales/new-sales" */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* CABECERA CON BOTÓN VOLVER (La nuestra) */}
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CAMPO: NOMBRE DEL CLIENTE */}
        <View style={styles.inputGroup}>
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
              placeholder="Ej. Juan Pérez"
              value={clientName}
              onChangeText={setClientName}
            />
          </View>
        </View>

        {/* CAMPO: TELÉFONO */}
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
              placeholder="55 1234 5678"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        {/* SELECCIÓN: TIPO DE CAFÉ */}
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

        {/* CAMPO: CANTIDAD (KG) */}
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

        {/* CAMPO: FECHA INTERACTIVA */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha de Venta</Text>
          {/* Cambiamos el TextInput por un TouchableOpacity que abre el calendario */}
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
            {/* Mostramos la fecha formateada */}
            <Text style={styles.inputText}>{formattedDate}</Text>
          </TouchableOpacity>
        </View>

        {/* COMPONENTE DEL CALENDARIO NATIVO (Oculto hasta que showPicker es true) */}
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        {/* CAMPO: MONTO TOTAL */}
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

        {/* BOTÓN REGISTRAR */}
        <TouchableOpacity style={styles.submitButton}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={COLORS.white}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.submitButtonText}>Registrar Venta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  inputText: { flex: 1, fontSize: 16, color: COLORS.text }, // Estilo para el texto de la fecha
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
