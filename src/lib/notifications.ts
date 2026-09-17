import type { Appointment, Task, Priority } from '../types';
import { todayISO, nowHM, addDaysISO, formatDatePt } from './utils';
import { occurrencesOn } from './recurrence';

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
  goals: { id: string; title: string; deadline: string; progress: number }[] = [],
  /** Data de referência (YYYY-MM-DD local). Injetada para manter a função pura. */
  today: string = todayISO(),
  /** Hora atual (HH:mm). Também injetada, para a função continuar testável. */
  now: string = nowHM()
): AppNotification[] {
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
      // Com horário definido e já vencido, "Vence hoje" seria enganoso às 18h
      // para algo marcado para as 14h.
      const alreadyDue = !!task.dueTime && task.dueTime < now;
      items.push({
        id: alreadyDue ? `overdue:${task.id}` : `today:${task.id}`,
        kind: alreadyDue ? 'overdue' : 'today',
        title: task.title,
        detail: alreadyDue ? `Venceu hoje às ${task.dueTime}` : task.dueTime ? `Vence hoje às ${task.dueTime}` : 'Vence hoje',
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

  // occurrencesOn expande as séries: um compromisso semanal avisa toda semana,
  // e não só no dia em que foi criado.
  for (const occurrence of occurrencesOn(appointments, today)) {
    const passed = occurrence.time < now;
    items.push({
      id: `appt:${occurrence.occurrenceId}`,
      kind: 'appointment',
      title: occurrence.title,
      detail: `${passed ? 'Começou hoje às' : 'Compromisso hoje às'} ${occurrence.time}${occurrence.location ? ` · ${occurrence.location}` : ''}`,
      date: occurrence.date,
      time: occurrence.time,
      priority: occurrence.priority,
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
