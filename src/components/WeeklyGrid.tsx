import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DayIndex, ScheduledBlock, TaskUrgency } from "../hooks/useKronos";
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

function getUrgencyColor(urgency: TaskUrgency): string {
  switch (urgency) {
    case "baja":
      return Colors.urgencyLow;
    case "media":
      return Colors.urgencyMedium;
    case "alta":
      return Colors.urgencyHigh;
  }
}

export const WeeklyGrid: React.FC<WeeklyGridProps> = ({
  weekDays,
  blocksByDay,
  onSelectBlock,
}) => {
  const columnTotalHeight = LayoutConfig.totalHours * LayoutConfig.hourHeight;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.timeSpacer} />
        {weekDays.map((day) => (
          <View key={day.isoDate} style={styles.dayHeaderCell}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <Text style={styles.dayNumber}>{day.dayNumber}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ height: columnTotalHeight + 24 }}
        showsVerticalScrollIndicator
      >
        <View style={[styles.gridBody, { height: columnTotalHeight }]}>
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

          {weekDays.map((day) => {
            const dayBlocks = blocksByDay[day.dayIndex] || [];

            return (
              <View
                key={day.isoDate}
                style={[styles.dayColumn, { height: columnTotalHeight }]}
              >
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
                      {block.activity.kind === "task" && (
                        <View
                          style={[
                            styles.urgencyDot,
                            {
                              backgroundColor: getUrgencyColor(
                                block.activity.urgency,
                              ),
                            },
                          ]}
                        />
                      )}
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
  urgencyDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  blockTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
});
