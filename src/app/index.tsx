import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityDetailModal } from "../components/ActivityDetailModal";
import { ActivityModalForm } from "../components/ActivityModalForm";
import { WeeklyGrid } from "../components/WeeklyGrid";
import {
  formatMinutesToDuration,
  ScheduledBlock,
  useKronos,
} from "../hooks/useKronos";
import { Colors } from "../styles/app-themes";

export default function KronosHomeScreen() {
  const {
    weekDays,
    weekOffset,
    setWeekOffset,
    blocksByDay,
    dailySummary,
    addActivity,
    updateTaskStatus,
    deleteActivity,
  } = useKronos();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(
    null,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Encabezado principal */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>Kronos</Text>
          <Text style={styles.appSubtitle}>Agenda visual estudiantil</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsFormVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Actividad</Text>
        </TouchableOpacity>
      </View>

      {/* Navegación de semana */}
      <View style={styles.weekNavRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setWeekOffset((prev) => prev - 1)}
        >
          <Text style={styles.navBtnText}>← Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setWeekOffset(0)}>
          <Text style={styles.weekRangeText}>
            {weekDays[0]?.isoDate} al {weekDays[6]?.isoDate}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setWeekOffset((prev) => prev + 1)}
        >
          <Text style={styles.navBtnText}>Siguiente →</Text>
        </TouchableOpacity>
      </View>

      {/* Resumen diario de tiempo libre (24h) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.summaryScroll}
        contentContainerStyle={styles.summaryContent}
      >
        {dailySummary.map((item) => (
          <View key={item.isoDate} style={styles.summaryPill}>
            <Text style={styles.summaryDay}>{item.label}</Text>
            <Text style={styles.summaryFree}>
              Libre: {formatMinutesToDuration(item.freeMinutes)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Cuadrícula semanal */}
      <WeeklyGrid
        weekDays={weekDays}
        blocksByDay={blocksByDay}
        onSelectBlock={(block) => setSelectedBlock(block)}
      />

      {/* Modal para crear rutina o tarea */}
      <ActivityModalForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSave={addActivity}
      />

      {/* Modal con detalle al tocar un bloque */}
      <ActivityDetailModal
        block={selectedBlock}
        onClose={() => setSelectedBlock(null)}
        onDelete={deleteActivity}
        onChangeStatus={updateTaskStatus}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  appSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  weekNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.surface,
  },
  navBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  weekRangeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  summaryScroll: {
    maxHeight: 54,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryContent: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    alignItems: "center",
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  summaryDay: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  summaryFree: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.success,
  },
});
