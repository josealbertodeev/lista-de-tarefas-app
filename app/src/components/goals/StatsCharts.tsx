import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { addDays, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTaskStore } from '../../stores/useTaskStore';
import { isoFromTimestamp } from '../../lib/utils';
import { CATEGORIES, CATEGORY_COLORS } from '../../types';

export function WeeklyProductivityChart() {
  const tasks = useTaskStore((s) => s.tasks);

  const data = useMemo(() => {
    const start = startOfWeek(new Date(), { locale: ptBR });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      const iso = format(day, 'yyyy-MM-dd');
      const count = tasks.filter((t) => t.completedAt && isoFromTimestamp(t.completedAt) === iso).length;
      return { day: format(day, 'EEE', { locale: ptBR }), tarefas: count };
    });
  }, [tasks]);

  const total = data.reduce((sum, d) => sum + d.tarefas, 0);
  const best = data.reduce((a, b) => (b.tarefas > a.tarefas ? b : a), data[0]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">📅 Produtividade Semanal</h3>
        <span className="text-xs text-text-muted">
          Total: <strong className="text-text">{total}</strong> · Melhor dia: <strong className="text-text">{best.tarefas > 0 ? best.day : '-'}</strong>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={24} />
          <Tooltip
            cursor={{ fill: 'var(--color-surface-hover)' }}
            contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="tarefas" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBreakdownChart() {
  const tasks = useTaskStore((s) => s.tasks);

  const data = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        name: c,
        value: tasks.filter((t) => t.category === c).length,
        color: CATEGORY_COLORS[c],
      })).filter((d) => d.value > 0),
    [tasks]
  );

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center justify-center h-[280px] text-sm text-text-muted">
        Sem dados de categoria ainda.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-text mb-4">📁 Progresso por Categoria</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-1">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name} ({d.value})
          </span>
        ))}
      </div>
    </div>
  );
}
