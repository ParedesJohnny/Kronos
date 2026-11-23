import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Colors } from "../styles/app-themes";

export type ActivityKind = "task" | "routine";
export type TaskStatus = "pendiente" | "en progreso" | "hecha";
export type TaskUrgency = "baja" | "media" | "alta";
export type RoutineFrequency = "diaria" | "semanal";

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
  dueDate: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  status: TaskStatus;
  urgency: TaskUrgency;
}

export interface RoutineActivity extends BaseActivity {
  kind: "routine";
  frequency: RoutineFrequency;
  dayOfWeek: DayIndex;
  startTime: string;
  endTime: string;
}

export type Activity = TaskActivity | RoutineActivity;

export interface ScheduledBlock {
  instanceId: string;
  activity: Activity;
  dayIndex: DayIndex;
  startMinutes: number;
  durationMinutes: number;
  labelTime: string;
}

const STORAGE_KEY = "@kronos_activities_v1";

export function timeToMinutes(time: string): number {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr) || 0;
  const minutes = Number(minutesStr) || 0;
  return Math.max(0, Math.min(24 * 60, hours * 60 + minutes));
}

export function isValidISODate(dateStr: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const checkDate = new Date(year, month - 1, day);
  return (
    checkDate.getFullYear() === year &&
    checkDate.getMonth() === month - 1 &&
    checkDate.getDate() === day
  );
}

export function isValidTimeHHmm(timeStr: string): boolean {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr.trim());
  return Boolean(match);
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

function getDayIndexFromISO(isoDate: string): DayIndex {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y || 2026, (m || 1) - 1, d || 1);
  const jsDay = date.getDay(); // 0=Dom..6=Sáb
  return (jsDay === 0 ? 6 : jsDay - 1) as DayIndex;
}

function getActivityRangeMinutes(activity: Activity): {
  startMin: number;
  endMin: number;
} {
  if (activity.kind === "routine") {
    const startMin = timeToMinutes(activity.startTime);
    const endMin = Math.max(startMin + 15, timeToMinutes(activity.endTime));
    return {
      startMin,
      endMin: Math.min(24 * 60, endMin),
    };
  }
  const startMin = timeToMinutes(activity.startTime);
  const duration = Math.max(15, activity.durationMinutes);
  return {
    startMin,
    endMin: Math.min(24 * 60, startMin + duration),
  };
}

function activitiesOverlapOnSameContext(a: Activity, b: Activity): boolean {
  const rangeA = getActivityRangeMinutes(a);
  const rangeB = getActivityRangeMinutes(b);

  const timeOverlaps =
    rangeA.startMin < rangeB.endMin && rangeA.endMin > rangeB.startMin;
  if (!timeOverlaps) return false;

  if (a.kind === "task" && b.kind === "task") {
    return a.scheduledDate === b.scheduledDate;
  }

  if (a.kind === "routine" && b.kind === "routine") {
    if (a.frequency === "diaria" || b.frequency === "diaria") return true;
    return a.dayOfWeek === b.dayOfWeek;
  }

  if (a.kind === "task" && b.kind === "routine") {
    if (b.frequency === "diaria") return true;
    return getDayIndexFromISO(a.scheduledDate) === b.dayOfWeek;
  }

  if (a.kind === "routine" && b.kind === "task") {
    if (a.frequency === "diaria") return true;
    return getDayIndexFromISO(b.scheduledDate) === a.dayOfWeek;
  }

  return false;
}

export function useKronos() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setActivities(parsed);
          }
        }
      } catch (e) {
        console.warn("Error cargando actividades de AsyncStorage:", e);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activities)).catch((e) =>
      console.warn("Error guardando actividades en AsyncStorage:", e),
    );
  }, [activities, isLoaded]);

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

  const checkOverlap = useCallback(
    (candidate: Activity, ignoreId?: string): boolean => {
      return activities.some(
        (existing) =>
          existing.id !== ignoreId &&
          activitiesOverlapOnSameContext(candidate, existing),
      );
    },
    [activities],
  );

  const addActivity = useCallback(
    (
      input:
        | Omit<TaskActivity, "id" | "color">
        | Omit<RoutineActivity, "id" | "color">,
    ): { ok: boolean; error?: string } => {
      const nextColor = Colors.blocks[activities.length % Colors.blocks.length];
      const newItem: Activity = {
        ...input,
        id: `${input.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        color: nextColor,
      } as Activity;

      if (checkOverlap(newItem)) {
        return {
          ok: false,
          error: "Ese horario ya está ocupado por otra actividad.",
        };
      }

      setActivities((prev) => [...prev, newItem]);
      return { ok: true };
    },
    [activities.length, checkOverlap],
  );

  const updateActivity = useCallback(
    (updated: Activity): { ok: boolean; error?: string } => {
      if (checkOverlap(updated, updated.id)) {
        return {
          ok: false,
          error: "Ese horario ya está ocupado por otra actividad.",
        };
      }

      setActivities((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      return { ok: true };
    },
    [checkOverlap],
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
            const { startMin, endMin } = getActivityRangeMinutes(activity);
            const duration = Math.max(15, endMin - startMin);

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
          if (activity.scheduledDate === dayInfo.isoDate) {
            const { startMin, endMin } = getActivityRangeMinutes(activity);
            const duration = Math.max(15, endMin - startMin);

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
    updateActivity,
    updateTaskStatus,
    deleteActivity,
  };
}
