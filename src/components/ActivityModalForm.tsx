import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Activity,
  ActivityKind,
  DayIndex,
  isValidISODate,
  isValidTimeHHmm,
  RoutineActivity,
  RoutineFrequency,
  TaskActivity,
  TaskStatus,
  TaskUrgency,
  toISODateString,
} from "../hooks/useKronos";
import { Colors } from "../styles/app-themes";

type CreatePayload =
  | Omit<TaskActivity, "id" | "color">
  | Omit<RoutineActivity, "id" | "color">;

interface ActivityModalFormProps {
  visible: boolean;
  initialActivity?: Activity | null;
  onClose: () => void;
  onSave: (
    payload: CreatePayload,
    editingId?: string,
  ) => { ok: boolean; error?: string };
}

const DAYS_OPTIONS: { label: string; value: DayIndex }[] = [
  { label: "Lun", value: 0 },
  { label: "Mar", value: 1 },
  { label: "Mié", value: 2 },
  { label: "Jue", value: 3 },
  { label: "Vie", value: 4 },
  { label: "Sáb", value: 5 },
  { label: "Dom", value: 6 },
];

const STATUS_OPTIONS: TaskStatus[] = ["pendiente", "en progreso", "hecha"];
const URGENCY_OPTIONS: TaskUrgency[] = ["baja", "media", "alta"];

export const ActivityModalForm: React.FC<ActivityModalFormProps> = ({
  visible,
  initialActivity = null,
  onClose,
  onSave,
}) => {
  const todayISO = toISODateString(new Date());

  const [kind, setKind] = useState<ActivityKind>("task");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [dueDate, setDueDate] = useState(todayISO);
  const [scheduledDate, setScheduledDate] = useState(todayISO);
  const [taskStartTime, setTaskStartTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [status, setStatus] = useState<TaskStatus>("pendiente");
  const [urgency, setUrgency] = useState<TaskUrgency>("media");

  const [frequency, setFrequency] = useState<RoutineFrequency>("semanal");
  const [dayOfWeek, setDayOfWeek] = useState<DayIndex>(0);
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");

  useEffect(() => {
    if (!visible) return;

    if (initialActivity) {
      setKind(initialActivity.kind);
      setName(initialActivity.name);
      setDescription(initialActivity.description);

      if (initialActivity.kind === "task") {
        setDueDate(initialActivity.dueDate);
        setScheduledDate(initialActivity.scheduledDate);
        setTaskStartTime(initialActivity.startTime);
        setDurationMinutes(String(initialActivity.durationMinutes));
        setStatus(initialActivity.status);
        setUrgency(initialActivity.urgency);
      } else {
        setFrequency(initialActivity.frequency);
        setDayOfWeek(initialActivity.dayOfWeek);
        setStartTime(initialActivity.startTime);
        setEndTime(initialActivity.endTime);
      }
    } else {
      setKind("task");
      setName("");
      setDescription("");
      setDueDate(todayISO);
      setScheduledDate(todayISO);
      setTaskStartTime("10:00");
      setDurationMinutes("60");
      setStatus("pendiente");
      setUrgency("media");
      setFrequency("semanal");
      setDayOfWeek(0);
      setStartTime("07:00");
      setEndTime("08:00");
    }
  }, [visible, initialActivity, todayISO]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Campo requerido", "Por favor ingresa un nombre.");
      return;
    }

    let payload: CreatePayload;

    if (kind === "task") {
      const cleanScheduledDate = scheduledDate.trim();
      const cleanDueDate = dueDate.trim();
      const cleanStartTime = taskStartTime.trim();

      if (!isValidISODate(cleanScheduledDate)) {
        Alert.alert(
          "Fecha no válida",
          "La fecha en la que se desea realizar no está bien ingresada. Usa el formato AAAA-MM-DD (ej. 2026-11-23).",
        );
        return;
      }

      if (!isValidISODate(cleanDueDate)) {
        Alert.alert(
          "Fecha no válida",
          "La fecha de entrega no está bien ingresada. Usa el formato AAAA-MM-DD (ej. 2026-11-25).",
        );
        return;
      }

      if (!isValidTimeHHmm(cleanStartTime)) {
        Alert.alert(
          "Hora no válida",
          "La hora de inicio no está bien ingresada. Usa el formato HH:mm de 24 horas (ej. 14:00).",
        );
        return;
      }

      const parsedDuration = Number(durationMinutes);
      if (!parsedDuration || parsedDuration <= 0) {
        Alert.alert(
          "Duración inválida",
          "Ingresa una duración aproximada en minutos mayor a 0.",
        );
        return;
      }

      payload = {
        kind: "task",
        name: trimmedName,
        description: description.trim(),
        dueDate: cleanDueDate,
        scheduledDate: cleanScheduledDate,
        startTime: cleanStartTime,
        durationMinutes: parsedDuration,
        status,
        urgency,
      };
    } else {
      const cleanStartTime = startTime.trim();
      const cleanEndTime = endTime.trim();

      if (!isValidTimeHHmm(cleanStartTime) || !isValidTimeHHmm(cleanEndTime)) {
        Alert.alert(
          "Hora no válida",
          "Las horas de inicio o fin no están bien ingresadas. Usa el formato HH:mm de 24 horas (ej. 07:00).",
        );
        return;
      }

      payload = {
        kind: "routine",
        name: trimmedName,
        description: description.trim(),
        frequency,
        dayOfWeek,
        startTime: cleanStartTime,
        endTime: cleanEndTime,
      };
    }

    const result = onSave(payload, initialActivity?.id);
    if (!result.ok) {
      Alert.alert(
        "Horario ocupado",
        result.error || "Ese horario ya está ocupado.",
      );
      return;
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {initialActivity ? "Editar actividad" : "Nueva actividad"}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!initialActivity && (
              <>
                <Text style={styles.sectionLabel}>¿Qué deseas crear?</Text>
                <View style={styles.segmentedRow}>
                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      kind === "task" && styles.segmentBtnActive,
                    ]}
                    onPress={() => setKind("task")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        kind === "task" && styles.segmentTextActive,
                      ]}
                    >
                      Tarea (1 vez)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      kind === "routine" && styles.segmentBtnActive,
                    ]}
                    onPress={() => setKind("routine")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        kind === "routine" && styles.segmentTextActive,
                      ]}
                    >
                      Rutina (Repetitiva)
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder={
                kind === "task"
                  ? "Ej. Ensayo de Historia"
                  : "Ej. Clases de Física"
              }
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detalles adicionales..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {kind === "task" ? (
              <>
                <Text style={styles.fieldLabel}>
                  Fecha en la que se desea realizar (YYYY-MM-DD)
                </Text>
                <TextInput
                  style={styles.input}
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  placeholder="2026-11-23"
                  placeholderTextColor={Colors.textMuted}
                />

                <Text style={styles.fieldLabel}>
                  Fecha de entrega (YYYY-MM-DD)
                </Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="2026-11-25"
                  placeholderTextColor={Colors.textMuted}
                />

                <View style={styles.twoCols}>
                  <View style={styles.colHalf}>
                    <Text style={styles.fieldLabel}>Hora inicio (HH:mm)</Text>
                    <TextInput
                      style={styles.input}
                      value={taskStartTime}
                      onChangeText={setTaskStartTime}
                      placeholder="14:00"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>

                  <View style={styles.colHalf}>
                    <Text style={styles.fieldLabel}>Duración aprox. (min)</Text>
                    <TextInput
                      style={styles.input}
                      value={durationMinutes}
                      onChangeText={setDurationMinutes}
                      keyboardType="numeric"
                      placeholder="60"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Estado</Text>
                <View style={styles.chipsRow}>
                  {STATUS_OPTIONS.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.chip, status === st && styles.chipActive]}
                      onPress={() => setStatus(st)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          status === st && styles.chipTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Urgencia</Text>
                <View style={styles.chipsRow}>
                  {URGENCY_OPTIONS.map((urg) => (
                    <TouchableOpacity
                      key={urg}
                      style={[
                        styles.chip,
                        urgency === urg && styles.chipActive,
                      ]}
                      onPress={() => setUrgency(urg)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          urgency === urg && styles.chipTextActive,
                        ]}
                      >
                        {urg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Frecuencia</Text>
                <View style={styles.segmentedRow}>
                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      frequency === "diaria" && styles.segmentBtnActive,
                    ]}
                    onPress={() => setFrequency("diaria")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        frequency === "diaria" && styles.segmentTextActive,
                      ]}
                    >
                      Diaria
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      frequency === "semanal" && styles.segmentBtnActive,
                    ]}
                    onPress={() => setFrequency("semanal")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        frequency === "semanal" && styles.segmentTextActive,
                      ]}
                    >
                      Semanal
                    </Text>
                  </TouchableOpacity>
                </View>

                {frequency === "semanal" && (
                  <>
                    <Text style={styles.fieldLabel}>Día de la semana</Text>
                    <View style={styles.chipsRow}>
                      {DAYS_OPTIONS.map((d) => (
                        <TouchableOpacity
                          key={d.value}
                          style={[
                            styles.chip,
                            dayOfWeek === d.value && styles.chipActive,
                          ]}
                          onPress={() => setDayOfWeek(d.value)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              dayOfWeek === d.value && styles.chipTextActive,
                            ]}
                          >
                            {d.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.twoCols}>
                  <View style={styles.colHalf}>
                    <Text style={styles.fieldLabel}>Hora inicio (HH:mm)</Text>
                    <TextInput
                      style={styles.input}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="07:00"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>

                  <View style={styles.colHalf}>
                    <Text style={styles.fieldLabel}>Hora fin (HH:mm)</Text>
                    <TextInput
                      style={styles.input}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="08:30"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.saveText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "88%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  segmentedRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 5,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  twoCols: {
    flexDirection: "row",
    gap: 10,
  },
  colHalf: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveText: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
