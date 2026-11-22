import { useCallback, useMemo, useState } from "react";
import { Colors } from "../styles/app-themes";

export type ActivityKind = "task" | "routine";
export type TaskStatus = "pendiente" | "en progreso" | "hecha";
export type TaskUrgency = "baja" | "media" | "alta";
export type RoutineFrequency = "diaria" | "semanal";

// 0 = Lunes, 1 = Martes, 2 = Miércoles, 3 = Jueves, 4 = Viernes, 5 = Sábado, 6 = Domingo
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BaseActivity {
  id: string;
  kind: ActivityKind;
  name: string;
  description: string;
  color: string;
}

export interface TaskActivity extends BaseActivity {
  kind: "task";
  dueDate: string; // YYYY-MM-DD
  scheduledDate: string; // YYYY-MM-DD (fecha en la que se desea realizar)
  startTime: string; // HH:mm (ej. "09:00")
  durationMinutes: number; // duración aproximada en minutos
  status: TaskStatus;
  urgency: TaskUrgency;
}

export interface RoutineActivity extends BaseActivity {
  kind: "routine";
  frequency: RoutineFrequency;
  dayOfWeek: DayIndex; // usado cuando frequency === 'semanal'
  startTime: string; // HH:mm (ej. "07:00")
  endTime: string; // HH:mm (ej. "08:30")
}

export type Activity = TaskActivity | RoutineActivity;

export interface ScheduledBlock {
  instanceId: string;
  activity: Activity;
  dayIndex: DayIndex;
  startMinutes: number; // minutos desde las 00:00 (0 a 1440)
  durationMinutes: number;
  labelTime: string;
}

export function timeToMinutes(time: string): number {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr) || 0;
  const minutes = Number(minutesStr) || 0;
  return Math.max(0, Math.min(24 * 60, hours * 60 + minutes));
}

export function formatMinutesToDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function getStartOfWeek(referenceDate: Date = new Date()): Date {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 (Dom) .. 6 (Sáb)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date;
}

export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "routine-1",
    kind: "routine",
    name: "MAT",
    description: "Clase de Matemáticas en aula 204",
    frequency: "semanal",
    dayOfWeek: 0,
    startTime: "08:00",
    endTime: "09:30",
    color: Colors.blocks[0],
  },
  {
    id: "routine-2",
    kind: "routine",
    name: "LECTURA",
    description: "Repaso diario y lectura personal",
    frequency: "diaria",
    dayOfWeek: 0,
    startTime: "19:00",
    endTime: "20:00",
    color: Colors.blocks[2],
  },
];

export function useKronos() {
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const weekDays = useMemo(() => {
    const baseMonday = getStartOfWeek(new Date());
    baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);

    const labels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
    return labels.map((label, idx) => {
      const date = new Date(baseMonday);
      date.setDate(baseMonday.getDate() + idx);
      return {
        dayIndex: idx as DayIndex,
        label,
        date,
        isoDate: toISODateString(date),
        dayNumber: date.getDate(),
      };
    });
  }, [weekOffset]);

  const addActivity = useCallback(
    (
      input:
        | Omit<TaskActivity, "id" | "color">
        | Omit<RoutineActivity, "id" | "color">,
    ) => {
      setActivities((prev) => {
        const nextColor = Colors.blocks[prev.length % Colors.blocks.length];
        const newItem: Activity = {
          ...input,
          id: `${input.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          color: nextColor,
        } as Activity;
        return [...prev, newItem];
      });
    },
    [],
  );

  const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id && item.kind === "task" ? { ...item, status } : item,
      ),
    );
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setActivities((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Construye los bloques visibles en la semana actual (24h por día)
  const blocksByDay = useMemo(() => {
    const map: Record<DayIndex, ScheduledBlock[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };

    weekDays.forEach((dayInfo) => {
      activities.forEach((activity) => {
        if (activity.kind === "routine") {
          const appliesToday =
            activity.frequency === "diaria" ||
            activity.dayOfWeek === dayInfo.dayIndex;

          if (appliesToday) {
            const startMin = timeToMinutes(activity.startTime);
            const endMin = Math.max(
              startMin + 15,
              timeToMinutes(activity.endTime),
            );
            const duration = Math.min(24 * 60 - startMin, endMin - startMin);

            map[dayInfo.dayIndex].push({
              instanceId: `${activity.id}-${dayInfo.isoDate}`,
              activity,
              dayIndex: dayInfo.dayIndex,
              startMinutes: startMin,
              durationMinutes: duration,
              labelTime: `${activity.startTime} - ${activity.endTime}`,
            });
          }
        } else if (activity.kind === "task") {
          // Las tareas solo se muestran una sola vez en su fecha deseada de realización
          if (activity.scheduledDate === dayInfo.isoDate) {
            const startMin = timeToMinutes(activity.startTime);
            const duration = Math.max(
              15,
              Math.min(24 * 60 - startMin, activity.durationMinutes),
            );

            map[dayInfo.dayIndex].push({
              instanceId: `${activity.id}-${dayInfo.isoDate}`,
              activity,
              dayIndex: dayInfo.dayIndex,
              startMinutes: startMin,
              durationMinutes: duration,
              labelTime: activity.startTime,
            });
          }
        }
      });
    });

    return map;
  }, [activities, weekDays]);

  // Calcula minutos ocupados y libres (sobre 1440 min = 24h) por día
  const dailySummary = useMemo(() => {
    return weekDays.map((dayInfo) => {
      const dayBlocks = blocksByDay[dayInfo.dayIndex];
      const occupiedMinutes = dayBlocks.reduce(
        (acc, b) => acc + b.durationMinutes,
        0,
      );
      const clampedOccupied = Math.min(24 * 60, occupiedMinutes);
      const freeMinutes = Math.max(0, 24 * 60 - clampedOccupied);

      return {
        dayIndex: dayInfo.dayIndex,
        label: dayInfo.label,
        isoDate: dayInfo.isoDate,
        occupiedMinutes: clampedOccupied,
        freeMinutes,
      };
    });
  }, [blocksByDay, weekDays]);

  return {
    activities,
    weekDays,
    weekOffset,
    setWeekOffset,
    blocksByDay,
    dailySummary,
    addActivity,
    updateTaskStatus,
    deleteActivity,
  };
}
