import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";

export default function StatsScreen() {
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState("Mes"); 
  const filters = ["Hoy", "Semana", "Mes", "Año"];

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referenceDate, setReferenceDate] = useState(new Date());

  // ESTADOS PARA EL MODAL DE REPORTES
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isFetchingMonths, setIsFetchingMonths] = useState(false);

  // CARGAR VENTAS 
  useEffect(() => {
    if (!user) return;

    const { start, end } = getPeriodBoundaries();

    const q = query(
      collection(db, "sales"),
      where("userId", "==", user.uid),
      where("date", ">=", start.toISOString()), 
      where("date", "<=", end.toISOString()), 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSales(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, referenceDate, activeFilter]);

  // CALCULAR RANGO DE FECHAS PARA LA VISTA PRINCIPAL
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
      end.setTime(start.getTime());
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

  const shiftDate = (direction) => {
    if (direction === 1 && !canGoForward) return;

    const newDate = new Date(referenceDate);
    if (activeFilter === "Hoy") newDate.setDate(newDate.getDate() + direction);
    else if (activeFilter === "Semana") newDate.setDate(newDate.getDate() + direction * 7);
    else if (activeFilter === "Mes") newDate.setMonth(newDate.getMonth() + direction);
    else if (activeFilter === "Año") newDate.setFullYear(newDate.getFullYear() + direction);

    setReferenceDate(newDate);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setReferenceDate(new Date());
  };

  const getPeriodText = () => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    if (activeFilter === "Hoy") return `${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`;
    if (activeFilter === "Semana") return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`;
    if (activeFilter === "Mes") return `${months[start.getMonth()]} ${start.getFullYear()}`;
    if (activeFilter === "Año") return `${start.getFullYear()}`;
  };

  // CALCULAR TOTALES PARA LA VISTA PRINCIPAL
  let mainTotalQty = 0;
  let mainTotalMoney = 0;
  let mainQtyGrano = 0, mainQtyMolido = 0, mainQtyExpresso = 0;

  sales.forEach((sale) => {
    mainTotalQty += sale.quantity || 0;
    mainTotalMoney += sale.total || 0;
    if (sale.coffeeType === "Grano") mainQtyGrano += sale.quantity;
    else if (sale.coffeeType === "Molido") mainQtyMolido += sale.quantity;
    else if (sale.coffeeType === "Expresso") mainQtyExpresso += sale.quantity;
  });

  const maxCoffee = Math.max(mainQtyGrano, mainQtyMolido, mainQtyExpresso, 10);
  const axisMax = Math.ceil(maxCoffee / 10) * 10;

  // Reportes mensuales

  // Meses con ventas
  const handleOpenReportModal = async () => {
    setReportModalVisible(true);
    setIsFetchingMonths(true);

    try {
      const qAll = query(collection(db, "sales"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(qAll);
      
      const monthsMap = {};
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      querySnapshot.docs.forEach(docSnap => {
        const sale = docSnap.data();
        const d = new Date(sale.date);
        const year = d.getFullYear();
        const month = d.getMonth();
        const key = `${year}-${month}`; 

        if (!monthsMap[key]) {
          monthsMap[key] = {
            label: `${monthNames[month]} ${year}`,
            sortKey: d.getTime(), 
            sales: []
          };
        }
        monthsMap[key].sales.push(sale);
      });

      const monthsArray = Object.values(monthsMap).sort((a, b) => b.sortKey - a.sortKey);
      setAvailableMonths(monthsArray);

    } catch (error) {
      console.error("Error obteniendo meses:", error);
      Alert.alert("Error", "No se pudieron cargar los meses disponibles.");
    } finally {
      setIsFetchingMonths(false);
    }
  };

  // Generar PDF
  const generatePDFForMonth = async (monthData) => {
    // Calculamos totales solo de este mes específico
    let totalQty = 0, totalMoney = 0;
    let qtyGrano = 0, qtyMolido = 0, qtyExpresso = 0;
    let moneyGrano = 0, moneyMolido = 0, moneyExpresso = 0;

    monthData.sales.forEach((sale) => {
      totalQty += sale.quantity || 0;
      totalMoney += sale.total || 0;
      if (sale.coffeeType === "Grano") { qtyGrano += sale.quantity; moneyGrano += sale.total; }
      else if (sale.coffeeType === "Molido") { qtyMolido += sale.quantity; moneyMolido += sale.total; }
      else if (sale.coffeeType === "Expresso") { qtyExpresso += sale.quantity; moneyExpresso += sale.total; }
    });

    const costoGrano = 0; 
    const costoMolido = 0;
    const costoExpresso = 0;
    const costoTotal = 0; 

    const gananciaGrano = moneyGrano - costoGrano;
    const gananciaMolido = moneyMolido - costoMolido;
    const gananciaExpresso = moneyExpresso - costoExpresso;
    const gananciaTotal = totalMoney - costoTotal;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            h1 { color: #5D4037; text-align: center; }
            p { text-align: center; font-size: 16px; color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
            th { background-color: #5D4037; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .total-row { font-weight: bold; background-color: #d7ccc8 !important; }
            .profit-col { color: #2e7d32; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Reporte de Ventas - Café Otilia</h1>
          <p>Reporte correspondiente a: <strong>${monthData.label}</strong></p>
          
          <table>
            <tr>
              <th>Tipo de Café</th>
              <th>Cantidad Vendida (kg)</th>
              <th>Ingresos Totales</th>
              <th>Inversión (Costo)</th>
              <th>Ganancia Neta</th>
            </tr>
            <tr>
              <td>Grano</td>
              <td>${qtyGrano} kg</td>
              <td>$${moneyGrano}</td>
              <td>$${costoGrano}</td>
              <td class="profit-col">$${gananciaGrano}</td>
            </tr>
            <tr>
              <td>Molido</td>
              <td>${qtyMolido} kg</td>
              <td>$${moneyMolido}</td>
              <td>$${costoMolido}</td>
              <td class="profit-col">$${gananciaMolido}</td>
            </tr>
            <tr>
              <td>Expresso</td>
              <td>${qtyExpresso} kg</td>
              <td>$${moneyExpresso}</td>
              <td>$${costoExpresso}</td>
              <td class="profit-col">$${gananciaExpresso}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL GENERAL</td>
              <td>${totalQty} kg</td>
              <td>$${totalMoney}</td>
              <td>$${costoTotal}</td>
              <td class="profit-col">$${gananciaTotal}</td>
            </tr>
          </table>
          
          <p style="margin-top: 50px; font-size: 12px; text-align: left;">
            Generado automáticamente desde la aplicación Café Otilia.<br>
            Fecha de generación: ${new Date().toLocaleDateString("es-ES")}
          </p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      setReportModalVisible(false); 
      await Sharing.shareAsync(uri, { dialogTitle: "Compartir Reporte", mimeType: "application/pdf" });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo generar el reporte");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ height: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 20 }} />
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* FILTROS PRINCIPALES */}
        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterPill, activeFilter === filter && styles.filterPillActive]}
              onPress={() => handleFilterChange(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* NAVEGADOR DE TIEMPO (< MES >) */}
        <View style={styles.periodNavigator}>
          <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.periodText}>{getPeriodText()}</Text>

          <TouchableOpacity
            onPress={() => shiftDate(1)}
            style={[styles.navButton, !canGoForward && { opacity: 0.3 }]}
            disabled={!canGoForward}
          >
            <Ionicons name="chevron-forward" size={24} color={canGoForward ? COLORS.primary : COLORS.gray} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View style={[styles.iconContainer, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="cube" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Total vendido</Text>
                  <Text style={styles.summaryValue}>{mainTotalQty} kg</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.iconContainer, { backgroundColor: COLORS.success }]}>
                  <Ionicons name="cash" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Ingresos</Text>
                  <Text style={styles.summaryValue}>${mainTotalMoney}</Text>
                </View>
              </View>
            </View>

            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Ventas Por Tipo</Text>

              {sales.length === 0 ? (
                <Text style={{ textAlign: "center", color: COLORS.gray, paddingVertical: 50 }}>No hay ventas en este período.</Text>
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
                      <Text style={styles.barFloatingValue}>{mainQtyGrano} kg</Text>
                      <View style={styles.barBackground}>
                        <View style={[styles.barFill, { height: `${(mainQtyGrano / axisMax) * 100}%` }]} />
                      </View>
                      <Text style={styles.barLabel}>Grano</Text>
                    </View>

                    <View style={styles.barWrapper}>
                      <Text style={styles.barFloatingValue}>{mainQtyMolido} kg</Text>
                      <View style={styles.barBackground}>
                        <View style={[styles.barFill, { height: `${(mainQtyMolido / axisMax) * 100}%` }]} />
                      </View>
                      <Text style={styles.barLabel}>Molido</Text>
                    </View>

                    <View style={styles.barWrapper}>
                      <Text style={styles.barFloatingValue}>{mainQtyExpresso} kg</Text>
                      <View style={styles.barBackground}>
                        <View style={[styles.barFill, { height: `${(mainQtyExpresso / axisMax) * 100}%` }]} />
                      </View>
                      <Text style={styles.barLabel}>Expresso</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* BOTÓN PARA ABRIR MODAL DE REPORTES */}
            <TouchableOpacity style={styles.reportButton} onPress={handleOpenReportModal}>
              <Ionicons name="document-text" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.reportButtonText}>Generar Reporte Mensual</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* MODAL PARA SELECCIONAR MES DEL REPORTE */}
      <Modal visible={reportModalVisible} transparent={true} animationType="fade" onRequestClose={() => setReportModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setReportModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setReportModalVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.gray} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Generar Reporte</Text>
            <Text style={styles.modalSubtitle}>Selecciona el mes que deseas consultar:</Text>

            {isFetchingMonths ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 30 }} />
            ) : availableMonths.length === 0 ? (
              <Text style={styles.noMonthsText}>Aún no hay meses con ventas registradas.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300, marginTop: 10 }}>
                {availableMonths.map((monthObj) => (
                  <TouchableOpacity 
                    key={monthObj.label} 
                    style={styles.monthOption}
                    onPress={() => generatePDFForMonth(monthObj)}
                  >
                    <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.monthOptionText}>{monthObj.label}</Text>
                    <Ionicons name="download-outline" size={24} color={COLORS.secondary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.white },
  scrollContent: { padding: 20, paddingBottom: 40 },

  filtersContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  filterPill: { flex: 1, alignItems: "center", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 20, backgroundColor: "#E0E0E0", marginHorizontal: 3 },
  filterPillActive: { backgroundColor: COLORS.secondary },
  filterText: { color: COLORS.gray, fontWeight: "bold", fontSize: 12 },
  filterTextActive: { color: COLORS.white },

  periodNavigator: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.white, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, marginBottom: 25, elevation: 2 },
  navButton: { padding: 5 },
  periodText: { fontSize: 16, fontWeight: "bold", color: COLORS.primary },

  summaryContainer: { gap: 15, marginBottom: 30 },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: 15 },
  summaryLabel: { fontSize: 14, color: COLORS.gray, marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: "bold", color: COLORS.text },

  chartSection: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, marginBottom: 30, elevation: 3 },
  chartTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.primary, marginBottom: 20, textAlign: "center" },
  chartContainer: { flexDirection: "row", height: 220 },
  yAxis: { justifyContent: "space-between", paddingRight: 10, paddingBottom: 25, minWidth: 45 },
  axisText: { color: COLORS.gray, fontSize: 12 },
  barsArea: { flex: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: "#E0E0E0", borderLeftWidth: 1, borderLeftColor: "#E0E0E0", paddingBottom: 5 },
  barWrapper: { alignItems: "center", width: 50 },
  barFloatingValue: { fontSize: 10, color: COLORS.gray, fontWeight: "bold", marginBottom: 5 },
  barBackground: { height: 150, width: 35, justifyContent: "flex-end" },
  barFill: { backgroundColor: COLORS.primary, borderTopLeftRadius: 5, borderTopRightRadius: 5, width: "100%" },
  barLabel: { marginTop: 10, fontSize: 12, color: COLORS.text, fontWeight: "bold" },

  reportButton: { backgroundColor: COLORS.secondary, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 15, borderRadius: 12, elevation: 4 },
  reportButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },

  // ESTILOS DEL MODAL DE REPORTES
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { width: "100%", backgroundColor: COLORS.white, borderRadius: 20, padding: 25, elevation: 10 },
  closeModalButton: { position: "absolute", top: 15, right: 15, zIndex: 10, padding: 5 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.primary, textAlign: "center", marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: COLORS.gray, textAlign: "center", marginBottom: 15 },
  noMonthsText: { textAlign: "center", color: COLORS.gray, fontStyle: "italic", marginVertical: 20 },
  monthOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9F9F9", padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#EEE" },
  monthOptionText: { flex: 1, fontSize: 16, fontWeight: "bold", color: COLORS.text, marginLeft: 15 },
});