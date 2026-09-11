import type { Appointment, Task, Priority } from '../types';
import { todayISO, addDaysISO, formatDatePt } from './utils';

export type NotificationKind = 'overdue' | 'today' | 'soon' | 'appointment' | 'goal';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  /** ISO date the item refers to, used for ordering. */
  date: string;
  time?: string;
  priority?: Priority;
  /** View to open when the notification is clicked. */
  target: 'dashboard' | 'calendar' | 'goals';
}

const KIND_WEIGHT: Record<NotificationKind, number> = {
  overdue: 0,
  appointment: 1,
  today: 2,
  soon: 3,
  goal: 4,
};

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** Derives the notification feed from the current data. Pure — no side effects. */
export function buildNotifications(
  tasks: Task[],
  appointments: Appointment[],
  goals: { id: string; title: string; deadline: string; progress: number }[] = []
): AppNotification[] {
  const today = todayISO();
  const horizon = addDaysISO(today, 3);
  const items: AppNotification[] = [];

  for (const task of tasks) {
    if (task.status === 'completed' || !task.dueDate) continue;

    if (task.dueDate < today) {
      const late = daysBetween(task.dueDate, today);
      items.push({
        id: `overdue:${task.id}`,
        kind: 'overdue',
        title: task.title,
        detail: late === 1 ? 'Atrasada há 1 dia' : `Atrasada há ${late} dias`,
        date: task.dueDate,
        time: task.dueTime,
        priority: task.priority,
        target: 'dashboard',
      });
    } else if (task.dueDate === today) {
      items.push({
        id: `today:${task.id}`,
        kind: 'today',
        title: task.title,
        detail: task.dueTime ? `Vence hoje às ${task.dueTime}` : 'Vence hoje',
        date: task.dueDate,
        time: task.dueTime,
        priority: task.priority,
        target: 'dashboard',
      });
    } else if (task.dueDate <= horizon) {
      const inDays = daysBetween(today, task.dueDate);
      items.push({
        id: `soon:${task.id}`,
        kind: 'soon',
        title: task.title,
        detail: inDays === 1 ? 'Vence amanhã' : `Vence em ${inDays} dias`,
        date: task.dueDate,
        time: task.dueTime,
        priority: task.priority,
        target: 'dashboard',
      });
    }
  }

  for (const appt of appointments) {
    if (appt.date !== today) continue;
    items.push({
      id: `appt:${appt.id}`,
      kind: 'appointment',
      title: appt.title,
      detail: `Compromisso hoje às ${appt.time}${appt.location ? ` · ${appt.location}` : ''}`,
      date: appt.date,
      time: appt.time,
      priority: appt.priority,
      target: 'calendar',
    });
  }

  for (const goal of goals) {
    if (goal.progress >= 100 || goal.deadline < today || goal.deadline > horizon) continue;
    items.push({
      id: `goal:${goal.id}`,
      kind: 'goal',
      title: goal.title,
      detail:
        goal.deadline === today
          ? `Meta vence hoje · ${goal.progress}% concluída`
          : `Meta vence em ${formatDatePt(goal.deadline)} · ${goal.progress}% concluída`,
      date: goal.deadline,
      target: 'goals',
    });
  }

  return items.sort((a, b) => {
    const byKind = KIND_WEIGHT[a.kind] - KIND_WEIGHT[b.kind];
    if (byKind !== 0) return byKind;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (a.time ?? '99:99').localeCompare(b.time ?? '99:99');
  });
}
