import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { DayIndex, ScheduledBlock } from "../hooks/useKronos";
import { Colors, LayoutConfig } from "../styles/app-themes";

interface WeekDayColumn {
  dayIndex: DayIndex;
  label: string;
  isoDate: string;
  dayNumber: number;
}

interface WeeklyGridProps {
  weekDays: WeekDayColumn[];
  blocksByDay: Record<DayIndex, ScheduledBlock[]>;
  onSelectBlock: (block: ScheduledBlock) => void;
}

const HOURS = Array.from({ length: LayoutConfig.totalHours }, (_, i) => i);

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  weekDays,
  blocksByDay,
  onSelectBlock,
}) => {
  const columnTotalHeight = LayoutConfig.totalHours * LayoutConfig.hourHeight;

  return (
    <View style={styles.container}>
      {/* Cabecera de días */}
      <View style={styles.headerRow}>
        <View style={styles.timeSpacer} />
        {weekDays.map((day) => (
          <View key={day.isoDate} style={styles.dayHeaderCell}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <Text style={styles.dayNumber}>{day.dayNumber}</Text>
          </View>
        ))}
      </View>

      {/* Cuerpo desplazable con las 24 horas */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ height: columnTotalHeight + 24 }}
        showsVerticalScrollIndicator
      >
        <View style={[styles.gridBody, { height: columnTotalHeight }]}>
          {/* Columna de horas (00:00 a 23:00) */}
          <View style={styles.timeColumn}>
            {HOURS.map((hour) => (
              <View
                key={hour}
                style={[
                  styles.hourLabelRow,
                  { height: LayoutConfig.hourHeight },
                ]}
              >
                <Text style={styles.hourText}>
                  {String(hour).padStart(2, "0")}:00
                </Text>
              </View>
            ))}
          </View>

          {/* Columnas de cada día */}
          {weekDays.map((day) => {
            const dayBlocks = blocksByDay[day.dayIndex] || [];

            return (
              <View
                key={day.isoDate}
                style={[styles.dayColumn, { height: columnTotalHeight }]}
              >
                {/* Líneas horizontales por cada hora */}
                {HOURS.map((hour) => (
                  <View
                    key={hour}
                    style={[
                      styles.hourSlotLine,
                      {
                        top: hour * LayoutConfig.hourHeight,
                        height: LayoutConfig.hourHeight,
                      },
                    ]}
                  />
                ))}

                {/* Bloques de actividades */}
                {dayBlocks.map((block) => {
                  const topPx =
                    (block.startMinutes / 60) * LayoutConfig.hourHeight;
                  const rawHeightPx =
                    (block.durationMinutes / 60) * LayoutConfig.hourHeight;
                  const heightPx = Math.max(22, rawHeightPx);

                  return (
                    <TouchableOpacity
                      key={block.instanceId}
                      activeOpacity={0.85}
                      onPress={() => onSelectBlock(block)}
                      style={[
                        styles.blockCard,
                        {
                          top: topPx,
                          height: heightPx,
                          backgroundColor: block.activity.color,
                        },
                      ]}
                    >
                      <Text style={styles.blockTitle} numberOfLines={2}>
                        {block.activity.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  timeSpacer: {
    width: LayoutConfig.timeColumnWidth,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  gridBody: {
    flexDirection: "row",
  },
  timeColumn: {
    width: LayoutConfig.timeColumnWidth,
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  hourLabelRow: {
    justifyContent: "flex-start",
    paddingTop: 2,
    paddingRight: 6,
    alignItems: "flex-end",
  },
  hourText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  dayColumn: {
    flex: 1,
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  hourSlotLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  blockCard: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  blockTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
});
