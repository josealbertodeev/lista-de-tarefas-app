import { useMemo, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, Search } from 'lucide-react';
import { useTaskStore } from '../../stores/useTaskStore';
import type { Task, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { EditTaskModal } from '../modals/EditTaskModal';
import { CATEGORIES } from '../../types';
import { usePomodoroStore } from '../../stores/usePomodoroStore';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'backlog', title: 'A Fazer / Backlog' },
  { status: 'in_progress', title: 'Em Andamento' },
  { status: 'review', title: 'Em Revisão' },
  { status: 'completed', title: 'Concluídas Hoje' },
];

export function KanbanBoard() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const moveTask = useTaskStore((s) => s.moveTask);
  const focusMinutesToday = usePomodoroStore((s) => s.focusMinutesToday);
  const dailyTarget = usePomodoroStore((s) => s.sessionsCompletedToday);
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState<Task | null>(null);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (category === 'all' || t.category === category) &&
          t.title.toLowerCase().includes(filter.toLowerCase())
      ),
    [tasks, filter, category]
  );

  const onDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    moveTask(draggableId, destination.droppableId as TaskStatus);
  };

  const quickAdd = () => {
    const task = addTask({ title: 'Nova tarefa', category: 'Trabalho', priority: 'Média', pomodoroEstimate: 1 });
    setShowNewTaskModal(task);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col gap-1 mb-5">
        <span className="text-xs font-mono uppercase text-primary tracking-wider">Workspace · Sprint Atual</span>
        <h1 className="text-2xl font-bold text-text">Quadro de Tarefas</h1>
        <p className="text-sm text-text-muted">Gerencie o fluxo de trabalho através de colunas ágeis e blocos de foco.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar tarefas no quadro..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-sm text-text focus:outline-none focus:border-primary/60"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text focus:outline-none"
        >
          <option value="all">Todas as Categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={quickAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dim text-white font-medium text-sm transition-colors"
        >
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn key={col.status} status={col.status} title={col.title} tasks={filtered.filter((t) => t.status === col.status)} />
          ))}
        </div>
      </DragDropContext>

      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-border text-xs text-text-muted">
        <span>
          Total: <strong className="text-text">{tasks.length}</strong> tarefas
        </span>
        <span>
          Pomodoros hoje: <strong className="text-primary">{dailyTarget}</strong>
        </span>
        <span>
          Minutos de foco: <strong className="text-primary">{focusMinutesToday}</strong>
        </span>
      </div>

      {showNewTaskModal && <EditTaskModal open={!!showNewTaskModal} onClose={() => setShowNewTaskModal(null)} task={showNewTaskModal} />}
    </div>
  );
}
