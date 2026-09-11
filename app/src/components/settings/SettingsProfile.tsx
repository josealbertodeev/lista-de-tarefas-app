import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { User, Timer, Bell, Download, Upload, Sun, Moon, Trash2 } from 'lucide-react';
import { useProfileStore, titleForLevel } from '../../stores/useProfileStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { cn } from '../../lib/utils';
import { ConfirmDialog } from '../modals/Modal';

const FOCUS_OPTIONS = [20, 25, 30, 45, 50];
const SHORT_BREAK_OPTIONS = [5, 10, 15];
const LONG_BREAK_OPTIONS = [10, 15, 20, 30];

export function SettingsProfile() {
  const { profile, updateProfile, toggleTheme } = useProfileStore();
  const { tasks, appointments, goals } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    const payload = { tasks, appointments, goals, profile, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minhas-tarefas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.tasks) useTaskStore.setState({ tasks: data.tasks, appointments: data.appointments ?? [], goals: data.goals ?? [] });
        if (data.profile) useProfileStore.setState({ profile: data.profile });
        alert('Dados importados com sucesso!');
      } catch {
        alert('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  };

  const resetAllData = () => {
    useTaskStore.getState().clearAllTasks();
    useTaskStore.setState({ appointments: [], goals: [], lastCompletedTaskId: null });
    useProfileStore.setState((s) => ({
      profile: { ...s.profile, level: 1, xp: 0, totalXp: 0, streakDays: 0, lastActiveDate: undefined },
      achievements: [],
    }));
    usePomodoroStore.setState({
      phase: 'focus',
      isRunning: false,
      sessionsCompletedToday: 0,
      focusMinutesToday: 0,
      breakMinutesToday: 0,
      activeTaskId: undefined,
      secondsLeft: useProfileStore.getState().profile.focusMinutes * 60,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-text mb-1">Configurações & Perfil</h1>
      <p className="text-sm text-text-muted mb-6">Personalize sua experiência no Minhas Tarefas.</p>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm mb-5">
        <h2 className="flex items-center gap-2 font-semibold text-text mb-4">
          <User className="text-primary" size={18} /> Perfil
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
            {profile.name.trim() ? profile.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-text">
              Nível {profile.level} · {titleForLevel(profile.level)}
            </p>
            <p className="text-xs text-text-muted">{profile.totalXp.toLocaleString('pt-BR')} XP total</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Nome</label>
            <input
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              placeholder="Como podemos te chamar?"
              className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Cargo / Papel</label>
            <input
              value={profile.role}
              onChange={(e) => updateProfile({ role: e.target.value })}
              placeholder="Ex: Engenheiro de Produtividade"
              className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm mb-5">
        <h2 className="flex items-center gap-2 font-semibold text-text mb-4">
          <Timer className="text-primary" size={18} /> Parâmetros do Pomodoro
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <OptionGroup label="Foco (min)" options={FOCUS_OPTIONS} value={profile.focusMinutes} onChange={(v) => updateProfile({ focusMinutes: v })} />
          <OptionGroup label="Pausa Curta (min)" options={SHORT_BREAK_OPTIONS} value={profile.shortBreakMinutes} onChange={(v) => updateProfile({ shortBreakMinutes: v })} />
          <OptionGroup label="Pausa Longa (min)" options={LONG_BREAK_OPTIONS} value={profile.longBreakMinutes} onChange={(v) => updateProfile({ longBreakMinutes: v })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Meta diária de Pomodoros</label>
            <input
              type="number"
              min={1}
              value={profile.dailyPomodoroTarget}
              onChange={(e) => updateProfile({ dailyPomodoroTarget: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Meta diária de Tarefas</label>
            <input
              type="number"
              min={1}
              value={profile.dailyTaskTarget}
              onChange={(e) => updateProfile({ dailyTaskTarget: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-surface-hover border border-border text-text focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm mb-5">
        <h2 className="flex items-center gap-2 font-semibold text-text mb-4">
          <Bell className="text-primary" size={18} /> Preferências
        </h2>
        <div className="space-y-3">
          <ToggleRow label="Modo escuro" checked={profile.theme === 'dark'} onChange={toggleTheme} icon={profile.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} />
          <ToggleRow label="Sons de notificação" checked={profile.soundEnabled} onChange={() => updateProfile({ soundEnabled: !profile.soundEnabled })} />
          <ToggleRow label="Ruído branco durante o foco" checked={profile.whiteNoiseEnabled} onChange={() => updateProfile({ whiteNoiseEnabled: !profile.whiteNoiseEnabled })} />
          <ToggleRow label="Notificações do navegador" checked={profile.notificationsEnabled} onChange={() => updateProfile({ notificationsEnabled: !profile.notificationsEnabled })} />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-text mb-4">Backup de Dados</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportData} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-hover border border-border text-text font-medium text-sm hover:bg-surface transition-colors">
            <Download size={15} /> Exportar Dados (JSON)
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-hover border border-border text-text font-medium text-sm hover:bg-surface transition-colors">
            <Upload size={15} /> Importar Dados (JSON)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
          <button onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-colors ml-auto">
            <Trash2 size={15} /> Apagar Todos os Dados
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetAllData}
        title="Apagar Todos os Dados?"
        message="Todas as tarefas, compromissos, metas e seu progresso (nível, XP, sequência) serão apagados permanentemente. Esta ação não pode ser desfeita!"
      />
    </div>
  );
}

function OptionGroup({ label, options, value, onChange }: { label: string; options: number[]; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-text-muted mb-1 block">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              value === opt ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-surface-hover border-border text-text-muted hover:text-text'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: () => void; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-text flex items-center gap-2">
        {icon}
        {label}
      </span>
      <button
        onClick={onChange}
        className={cn('w-11 h-6 rounded-full relative transition-colors', checked ? 'bg-primary' : 'bg-surface-hover border border-border')}
      >
        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}
