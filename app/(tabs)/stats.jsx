import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../../constants/theme";

export default function StatsScreen() {
  // Filtro de tiempo seleccionado
  const [activeFilter, setActiveFilter] = useState("Mes");
  const filters = ["Día", "Semana", "Mes", "Año"];

  return (
    <View style={styles.container}>
      {/* Header */}
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
        {/* Filtros de tiempo */}
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

        {/* TARJETAS DE RESUMEN */}
        <View style={styles.summaryContainer}>
          {/* Tarjeta Total de café vendido */}
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
              <Text style={styles.summaryLabel}>Total de café vendido</Text>
              <Text style={styles.summaryValue}>30 kg</Text>
            </View>
          </View>

          {/* Tarjeta Total dinero generado */}
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
              <Text style={styles.summaryLabel}>Total dinero generado</Text>
              <Text style={styles.summaryValue}>$9,600</Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN DE GRÁFICA */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Ventas Por Tipo de Café</Text>

          <View style={styles.chartContainer}>
            {/* Eje Y Números */}
            <View style={styles.yAxis}>
              <Text style={styles.axisText}>50</Text>
              <Text style={styles.axisText}>40</Text>
              <Text style={styles.axisText}>30</Text>
              <Text style={styles.axisText}>20</Text>
              <Text style={styles.axisText}>10</Text>
              <Text style={styles.axisText}>0</Text>
            </View>

            {/* Barras de la gráfica */}
            <View style={styles.barsArea}>
              {/* Barra: Grano */}
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { height: "60%" }]} />
                </View>
                <Text style={styles.barLabel}>Grano</Text>
              </View>

              {/* Barra: Molido */}
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { height: "80%" }]} />
                </View>
                <Text style={styles.barLabel}>Molido</Text>
              </View>

              {/* Barra: Expresso */}
              <View style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { height: "30%" }]} />
                </View>
                <Text style={styles.barLabel}>Expresso</Text>
              </View>
            </View>
          </View>
        </View>

        {/* BOTÓN GENERAR REPORTE */}
        <TouchableOpacity style={styles.reportButton}>
          <Ionicons
            name="document-text"
            size={20}
            color={COLORS.white}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.reportButtonText}>Generar Reporte</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  filterPillActive: {
    backgroundColor: COLORS.secondary,
  },
  filterText: {
    color: COLORS.gray,
    fontWeight: "bold",
  },
  filterTextActive: {
    color: COLORS.white,
  },
  summaryContainer: {
    gap: 15,
    marginBottom: 30,
  },
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
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  chartSection: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  chartContainer: {
    flexDirection: "row",
    height: 200,
  },
  yAxis: {
    justifyContent: "space-between",
    paddingRight: 10,
    paddingBottom: 25, // Alinear las barras
  },
  axisText: {
    color: COLORS.gray,
    fontSize: 12,
  },
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
  barWrapper: {
    alignItems: "center",
    width: 40,
  },
  barBackground: {
    height: 150, // Altura total de la gráfica
    width: 35,
    justifyContent: "flex-end",
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  reportButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
