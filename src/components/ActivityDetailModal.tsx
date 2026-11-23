import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Activity,
  formatMinutesToDuration,
  ScheduledBlock,
  TaskStatus,
} from "../hooks/useKronos";
import { Colors } from "../styles/app-themes";

interface ActivityDetailModalProps {
  block: ScheduledBlock | null;
  onClose: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onChangeStatus: (activityId: string, status: TaskStatus) => void;
}

const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  block,
  onClose,
  onEdit,
  onDelete,
  onChangeStatus,
}) => {
  if (!block) return null;

  const activity: Activity = block.activity;

  return (
    <Modal
      visible={!!block}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View
            style={[styles.colorBanner, { backgroundColor: activity.color }]}
          >
            <Text style={styles.kindBadge}>
              {activity.kind === "task" ? "TAREA" : "RUTINA"}
            </Text>
            <Text style={styles.title}>{activity.name}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>Descripción</Text>
            <Text style={styles.value}>
              {activity.description || "Sin descripción"}
            </Text>

            <Text style={styles.label}>Duración del bloque</Text>
            <Text style={styles.value}>
              {formatMinutesToDuration(block.durationMinutes)} (
              {block.labelTime})
            </Text>

            {activity.kind === "task" ? (
              <>
                <Text style={styles.label}>Fecha deseada de realización</Text>
                <Text style={styles.value}>{activity.scheduledDate}</Text>

                <Text style={styles.label}>Fecha de entrega</Text>
                <Text style={styles.value}>{activity.dueDate}</Text>

                <Text style={styles.label}>Urgencia</Text>
                <Text style={[styles.value, styles.capitalize]}>
                  {activity.urgency}
                </Text>

                <Text style={styles.label}>Estado</Text>
                <View style={styles.statusRow}>
                  {(["pendiente", "en progreso", "hecha"] as TaskStatus[]).map(
                    (st) => (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusChip,
                          activity.status === st && styles.statusChipActive,
                        ]}
                        onPress={() => onChangeStatus(activity.id, st)}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            activity.status === st && styles.statusTextActive,
                          ]}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Repetición</Text>
                <Text style={[styles.value, styles.capitalize]}>
                  {activity.frequency}
                  {activity.frequency === "semanal"
                    ? ` (${DAY_NAMES[activity.dayOfWeek]})`
                    : ""}
                </Text>

                <Text style={styles.label}>Horario</Text>
                <Text style={styles.value}>
                  {activity.startTime} - {activity.endTime}
                </Text>
              </>
            )}

            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  onDelete(activity.id);
                  onClose();
                }}
              >
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  onClose();
                  onEdit(activity);
                }}
              >
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: "hidden",
  },
  colorBanner: {
    padding: 18,
  },
  kindBadge: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  body: {
    padding: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginTop: 10,
  },
  value: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  capitalize: {
    textTransform: "capitalize",
  },
  statusRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  statusChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  statusTextActive: {
    color: "#FFFFFF",
  },
  footerRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.dangerLight,
    alignItems: "center",
  },
  deleteText: {
    color: Colors.danger,
    fontWeight: "700",
    fontSize: 13,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
  },
  editText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  closeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
