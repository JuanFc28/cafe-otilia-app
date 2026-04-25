import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function StatsScreen() {
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState("Hoy");
  const filters = ["Hoy", "Semana", "Mes", "Año"];

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [referenceDate, setReferenceDate] = useState(new Date());

  // CARGAR VENTAS
  useEffect(() => {
    if (!user) return;

    // Calculamos los límites de tiempo antes de la consulta
    const { start, end } = getPeriodBoundaries();

    // La consulta ahora solo pide lo que está en el rango de fechas
    const q = query(
      collection(db, "sales"),
      where("userId", "==", user.uid),
      where("date", ">=", start.toISOString()), // Solo del inicio del periodo
      where("date", "<=", end.toISOString()), // al fin del periodo
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSales(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, referenceDate, activeFilter]);

  // CALCULAR RANGO DE FECHAS
  const getPeriodBoundaries = () => {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);

    if (activeFilter === "Hoy") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === "Semana") {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === "Mes") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (activeFilter === "Año") {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  };

  const { start, end } = getPeriodBoundaries();

  const canGoForward = end < new Date();

  // CAMBIAR DE PERÍODO CON FLECHAS
  const shiftDate = (direction) => {
    if (direction === 1 && !canGoForward) return;

    const newDate = new Date(referenceDate);
    if (activeFilter === "Hoy") newDate.setDate(newDate.getDate() + direction);
    else if (activeFilter === "Semana")
      newDate.setDate(newDate.getDate() + direction * 7);
    else if (activeFilter === "Mes")
      newDate.setMonth(newDate.getMonth() + direction);
    else if (activeFilter === "Año")
      newDate.setFullYear(newDate.getFullYear() + direction);

    setReferenceDate(newDate);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setReferenceDate(new Date());
  };

  //TEXTO A MOSTRAR
  const getPeriodText = () => {
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    if (activeFilter === "Hoy") {
      return `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
    } else if (activeFilter === "Semana") {
      return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`;
    } else if (activeFilter === "Mes") {
      return `${months[start.getMonth()]} ${start.getFullYear()}`;
    } else if (activeFilter === "Año") {
      return `${start.getFullYear()}`;
    }
  };

  //CALCULAR TOTALES
  let totalQty = 0;
  let totalMoney = 0;
  let qtyGrano = 0;
  let qtyMolido = 0;
  let qtyExpresso = 0;

  const filteredSales = sales;

  filteredSales.forEach((sale) => {
    totalQty += sale.quantity || 0;
    totalMoney += sale.total || 0;
    if (sale.coffeeType === "Grano") qtyGrano += sale.quantity;
    else if (sale.coffeeType === "Molido") qtyMolido += sale.quantity;
    else if (sale.coffeeType === "Expresso") qtyExpresso += sale.quantity;
  });

  const maxCoffee = Math.max(qtyGrano, qtyMolido, qtyExpresso, 10);
  const axisMax = Math.ceil(maxCoffee / 10) * 10;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={{
            height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20,
          }}
        />
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FILTROS PRINCIPALES */}
        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.filterPillActive,
              ]}
              onPress={() => handleFilterChange(filter)}
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

        {/* NAVEGADOR DE TIEMPO (< MES >) */}
        <View style={styles.periodNavigator}>
          <TouchableOpacity
            onPress={() => shiftDate(-1)}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.periodText}>{getPeriodText()}</Text>

          {/* BOTON DERECHO BLOQUEADO */}
          <TouchableOpacity
            onPress={() => shiftDate(1)}
            style={[styles.navButton, !canGoForward && { opacity: 0.3 }]}
            disabled={!canGoForward}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={canGoForward ? COLORS.primary : COLORS.gray}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: COLORS.primary },
                  ]}
                >
                  <Ionicons name="cube" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Total vendido</Text>
                  <Text style={styles.summaryValue}>{totalQty} kg</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: COLORS.success },
                  ]}
                >
                  <Ionicons name="cash" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Ingresos</Text>
                  <Text style={styles.summaryValue}>${totalMoney}</Text>
                </View>
              </View>
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Ventas Por Tipo</Text>

              {filteredSales.length === 0 ? (
                <Text
                  style={{
                    textAlign: "center",
                    color: COLORS.gray,
                    paddingVertical: 50,
                  }}
                >
                  No hay ventas en este período.
                </Text>
              ) : (
                <View style={styles.chartContainer}>
                  {/* EJE Y CON KG */}
                  <View style={styles.yAxis}>
                    <Text style={styles.axisText}>{axisMax} kg</Text>
                    <Text style={styles.axisText}>{axisMax * 0.75} kg</Text>
                    <Text style={styles.axisText}>{axisMax * 0.5} kg</Text>
                    <Text style={styles.axisText}>{axisMax * 0.25} kg</Text>
                    <Text style={styles.axisText}>0 kg</Text>
                  </View>

                  <View style={styles.barsArea}>
                    <View style={styles.barWrapper}>
                      <Text style={styles.barFloatingValue}>{qtyGrano} kg</Text>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${(qtyGrano / axisMax) * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>Grano</Text>
                    </View>

                    <View style={styles.barWrapper}>
                      <Text style={styles.barFloatingValue}>
                        {qtyMolido} kg
                      </Text>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${(qtyMolido / axisMax) * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>Molido</Text>
                    </View>

                    <View style={styles.barWrapper}>
                      <Text style={styles.barFloatingValue}>
                        {qtyExpresso} kg
                      </Text>
                      <View style={styles.barBackground}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${(qtyExpresso / axisMax) * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>Expresso</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.reportButton}>
              <Ionicons
                name="document-text"
                size={20}
                color={COLORS.white}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.reportButtonText}>
                Generar Reporte (Próximamente)
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.white },
  scrollContent: { padding: 20, paddingBottom: 40 },

  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  filterPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 3,
  },
  filterPillActive: { backgroundColor: COLORS.secondary },
  filterText: { color: COLORS.gray, fontWeight: "bold", fontSize: 12 },
  filterTextActive: { color: COLORS.white },

  periodNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 25,
    elevation: 2,
  },
  navButton: { padding: 5 },
  periodText: { fontSize: 16, fontWeight: "bold", color: COLORS.primary },

  summaryContainer: { gap: 15, marginBottom: 30 },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  summaryLabel: { fontSize: 14, color: COLORS.gray, marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: "bold", color: COLORS.text },

  chartSection: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  chartContainer: { flexDirection: "row", height: 220 },
  yAxis: {
    justifyContent: "space-between",
    paddingRight: 10,
    paddingBottom: 25,
    minWidth: 45,
  },
  axisText: { color: COLORS.gray, fontSize: 12 },
  barsArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    borderLeftWidth: 1,
    borderLeftColor: "#E0E0E0",
    paddingBottom: 5,
  },
  barWrapper: { alignItems: "center", width: 50 },
  barFloatingValue: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: "bold",
    marginBottom: 5,
  },
  barBackground: { height: 150, width: 35, justifyContent: "flex-end" },
  barFill: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    width: "100%",
  },
  barLabel: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "bold",
  },

  reportButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 4,
  },
  reportButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
});
