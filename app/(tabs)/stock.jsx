import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
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

export default function StockScreen() {
  const [stock, setStock] = useState({
    grano: "3",
    molido: "2",
    expresso: "1",
  });

  // Función para manejar los botones de + y -
  const updateStock = (type, delta) => {
    setStock((prev) => {
      // Convertimos el texto a número decimal. Si está vacío, usamos 0.
      const currentValue = parseFloat(prev[type]) || 0;
      // Sumamos o restamos, evitando que baje de 0
      let newValue = Math.max(0, currentValue + delta);

      return {
        ...prev,
        [type]: newValue.toString(), // Lo devolvemos a texto
      };
    });
  };

  // Función para escribir con el teclado
  const handleInputChange = (type, text) => {
    // Expresión regular: Solo permite números y UN punto decimal
    const sanitizedText = text.replace(/[^0-9.]/g, "");
    setStock((prev) => ({
      ...prev,
      [type]: sanitizedText,
    }));
  };

  return (
    <View style={styles.container}>
      {/*Header*/}
      <View style={styles.header}>
        <View
          style={{
            height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20,
          }}
        />
        <Text style={styles.title}>Stock de café</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.itemsContainer}>
          {/* Café en Grano */}
          <View style={styles.stockCard}>
            <View style={styles.cardInfo}>
              <View style={[styles.iconBox, { backgroundColor: "#EFEBE9" }]}>
                <Ionicons name="leaf" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.productName}>Café en grano</Text>
                {/* Mostramos el peso actual arriba para referencia */}
                <Text style={styles.productWeight}>
                  {stock.grano || "0"} kg
                </Text>
              </View>
            </View>

            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => updateStock("grano", -1)}
              >
                <Ionicons name="remove" size={28} color={COLORS.primary} />
              </TouchableOpacity>

              <View style={styles.countBox}>
                <TextInput
                  style={styles.countInput}
                  keyboardType="decimal-pad"
                  value={stock.grano}
                  onChangeText={(text) => handleInputChange("grano", text)}
                  selectTextOnFocus={true}
                />
              </View>

              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => updateStock("grano", 1)}
              >
                <Ionicons name="add" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Café Molido */}
          <View style={styles.stockCard}>
            <View style={styles.cardInfo}>
              <View style={[styles.iconBox, { backgroundColor: "#EFEBE9" }]}>
                <Ionicons name="cafe" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.productName}>Café molido</Text>
                <Text style={styles.productWeight}>
                  {stock.molido || "0"} kg
                </Text>
              </View>
            </View>

            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => updateStock("molido", -1)}
              >
                <Ionicons name="remove" size={28} color={COLORS.primary} />
              </TouchableOpacity>

              <View style={styles.countBox}>
                <TextInput
                  style={styles.countInput}
                  keyboardType="decimal-pad"
                  value={stock.molido}
                  onChangeText={(text) => handleInputChange("molido", text)}
                  selectTextOnFocus={true}
                />
              </View>

              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => updateStock("molido", 1)}
              >
                <Ionicons name="add" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Café Expresso */}
          <View style={styles.stockCard}>
            <View style={styles.cardInfo}>
              <View style={[styles.iconBox, { backgroundColor: "#EFEBE9" }]}>
                <Ionicons name="color-fill" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.productName}>Café expresso</Text>
                <Text style={styles.productWeight}>
                  {stock.expresso || "0"} kg
                </Text>
              </View>
            </View>

            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => updateStock("expresso", -1)}
              >
                <Ionicons name="remove" size={28} color={COLORS.primary} />
              </TouchableOpacity>

              <View style={styles.countBox}>
                <TextInput
                  style={styles.countInput}
                  keyboardType="decimal-pad"
                  value={stock.expresso}
                  onChangeText={(text) => handleInputChange("expresso", text)}
                  selectTextOnFocus={true}
                />
              </View>

              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => updateStock("expresso", 1)}
              >
                <Ionicons name="add" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.orderButton}>
          <Ionicons
            name="mail"
            size={24}
            color={COLORS.white}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.orderButtonText}>Hacer Pedido</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
//Estilos
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
  itemsContainer: { gap: 15, marginBottom: 40 },
  stockCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  productName: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  productWeight: { fontSize: 14, color: COLORS.gray, marginTop: 2 },

  // ▼▼ AQUI ES DONDE PUEDES EDITAR LOS TAMAÑOS ▼▼
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 5,
  },
  stepButton: {
    width: 40,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  countBox: {
    paddingHorizontal: 5,
    minWidth: 55,
    alignItems: "center",
  },
  countInput: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    width: "100%",
    padding: 0,
  },

  orderButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  orderButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
});
