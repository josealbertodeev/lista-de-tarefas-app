import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { User, Timer, Bell, BellRing, Download, Upload, Sun, Moon, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProfileStore, titleForLevel } from '../../stores/useProfileStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { usePomodoroStore } from '../../stores/usePomodoroStore';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { cn, formatDateBR } from '../../lib/utils';
import { ensureNotificationPermission, notificationPermission, notify, playTaskCompleteSound } from '../../lib/audio';
import { mergeById, parseBackup, serializeBackup } from '../../lib/backup';
import type { BackupPayload, BackupSummary } from '../../lib/backup';
import { Modal, ConfirmDialog } from '../modals/Modal';

/** Cópia de segurança automática gravada logo antes de uma importação. */
const PRE_IMPORT_KEY = 'minhas-tarefas-backup-pre-import';

const FOCUS_OPTIONS = [20, 25, 30, 45, 50];
const SHORT_BREAK_OPTIONS = [5, 10, 15];
const LONG_BREAK_OPTIONS = [10, 15, 20, 30];

export function SettingsProfile() {
  const { profile, updateProfile, toggleTheme } = useProfileStore();
  const { tasks, appointments, goals } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [permission, setPermission] = useState(notificationPermission());
  const [pending, setPending] = useState<{ data: BackupPayload; summary: BackupSummary } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState<string | null>(null);

  // A permissão é pedida aqui, a partir do clique do usuário — nunca de dentro de um
  // timer, que era o motivo do pedido aparecer em momentos aleatórios.
  const toggleBrowserNotifications = async () => {
    if (profile.notificationsEnabled) {
      updateProfile({ notificationsEnabled: false });
      return;
    }
    const result = await ensureNotificationPermission();
    setPermission(result);
    updateProfile({ notificationsEnabled: result === 'granted' });
  };

  const sendTestNotification = () => {
    const sent = notify('Notificação de teste 🔔', 'Se você está vendo isto, os avisos estão funcionando.', 'teste');
    if (!sent) setPermission(notificationPermission());
  };

  const exportData = () => {
    const pomodoro = usePomodoroStore.getState();
    const text = serializeBackup({
      tasks,
      appointments,
      goals,
      profile,
      // Conquistas e contadores de foco ficavam de fora: restaurar um backup
      // zerava esse progresso silenciosamente.
      achievements: useProfileStore.getState().achievements,
      pomodoro: {
        sessionsCompletedToday: pomodoro.sessionsCompletedToday,
        focusMinutesToday: pomodoro.focusMinutesToday,
        breakMinutesToday: pomodoro.breakMinutesToday,
        lastTickDate: pomodoro.lastTickDate,
      },
    });
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minhas-tarefas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // O arquivo é validado e resumido primeiro; nada é gravado antes da confirmação.
  const importData = (file: File) => {
    setImportError(null);
    setImportDone(null);
    const reader = new FileReader();
    reader.onerror = () => setImportError('Não foi possível ler o arquivo.');
    reader.onload = () => {
      const result = parseBackup(String(reader.result ?? ''));
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      setPending({ data: result.data, summary: result.summary });
    };
    reader.readAsText(file);
  };

  const applyImport = (mode: 'replace' | 'merge') => {
    if (!pending) return;
    const { data } = pending;

    // Rede de segurança: o estado atual fica guardado caso a importação decepcione.
    try {
      const current = useTaskStore.getState();
      localStorage.setItem(
        PRE_IMPORT_KEY,
        serializeBackup({
          tasks: current.tasks,
          appointments: current.appointments,
          goals: current.goals,
          profile: useProfileStore.getState().profile,
          achievements: useProfileStore.getState().achievements,
        })
      );
    } catch {
      // Sem espaço em disco para o backup preventivo: seguimos, o usuário pediu a importação.
    }

    useTaskStore.setState((s) =>
      mode === 'replace'
        ? { tasks: data.tasks, appointments: data.appointments, goals: data.goals }
        : {
            tasks: mergeById(s.tasks, data.tasks),
            appointments: mergeById(s.appointments, data.appointments),
            goals: mergeById(s.goals, data.goals),
          }
    );

    if (data.profile) {
      useProfileStore.setState((s) => ({ profile: { ...s.profile, ...data.profile } }));
    }
    if (data.achievements.length) {
      useProfileStore.setState((s) => ({ achievements: mergeById(s.achievements, data.achievements) }));
    }

    const total = data.tasks.length + data.appointments.length + data.goals.length;
    setImportDone(
      mode === 'replace'
        ? `${total} registros importados, substituindo os anteriores.`
        : `${total} registros analisados e mesclados aos existentes.`
    );
    setPending(null);
  };

  const resetAllData = () => {
    useTaskStore.getState().clearAllTasks();
    useTaskStore.setState({ appointments: [], goals: [] });
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
      endsAt: undefined,
      secondsLeft: useProfileStore.getState().profile.focusMinutes * 60,
    });
    // As marcações de notificação sobreviviam a um "apagar tudo".
    useNotificationStore.setState({ readIds: [], pushedIds: [] });
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
          <ToggleRow
            label="Sons de notificação"
            checked={profile.soundEnabled}
            onChange={() => {
              const enabled = !profile.soundEnabled;
              updateProfile({ soundEnabled: enabled });
              // Toca uma amostra ao ligar, para o interruptor ter resposta audível.
              if (enabled) setTimeout(playTaskCompleteSound, 0);
            }}
          />
          <ToggleRow label="Notificações do navegador" checked={profile.notificationsEnabled} onChange={toggleBrowserNotifications} />

          {permission === 'denied' && (
            <p className="text-xs text-red-400 pl-1">
              O navegador bloqueou as notificações para este site. Libere nas permissões do site para voltar a recebê-las.
            </p>
          )}
          {permission === 'unsupported' && (
            <p className="text-xs text-text-muted pl-1">Este navegador não oferece notificações do sistema.</p>
          )}

          {profile.notificationsEnabled && permission === 'granted' && (
            <button
              onClick={sendTestNotification}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-text-muted hover:text-primary hover:border-primary/40 text-xs font-medium transition-colors"
            >
              <BellRing size={13} /> Testar notificação
            </button>
          )}

          <p className="text-xs text-text-muted pl-1">
            Os avisos chegam enquanto o app estiver aberto em alguma aba.
          </p>
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

        {importError && (
          <p role="alert" className="mt-3 flex items-start gap-1.5 text-xs text-red-400 error-shake">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{importError} Seus dados atuais não foram alterados.</span>
          </p>
        )}
        {importDone && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-primary">
            <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
            <span>{importDone}</span>
          </p>
        )}
      </div>

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title="Revisar Importação"
        icon={<Upload className="text-primary" size={18} />}
      >
        {pending && (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Confira o que o arquivo contém antes de gravar.
              {pending.summary.exportedAt && ` Exportado em ${formatDateBR(pending.summary.exportedAt.slice(0, 10))}.`}
            </p>

            <div className="space-y-1.5">
              <SummaryRow label="Tarefas" value={pending.summary.tasks} />
              <SummaryRow label="Compromissos" value={pending.summary.appointments} />
              <SummaryRow label="Metas" value={pending.summary.goals} />
              {pending.summary.achievements.kept > 0 && <SummaryRow label="Conquistas" value={pending.summary.achievements} />}
            </div>

            {pending.summary.hasProfile && (
              <p className="text-xs text-text-muted">As configurações de perfil do arquivo também serão aplicadas.</p>
            )}

            <div className="p-3 rounded-xl bg-surface-hover border border-border text-xs text-text-muted">
              <strong className="text-text">Substituir</strong> apaga o que existe hoje e usa só o arquivo.{' '}
              <strong className="text-text">Mesclar</strong> mantém tudo e acrescenta apenas o que ainda não existe — é a
              opção certa para juntar dados de outro dispositivo.
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
              <button
                onClick={() => setPending(null)}
                className="w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-xl border border-border text-text hover:bg-surface-hover transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => applyImport('merge')}
                className="w-full sm:flex-1 min-w-0 py-2.5 px-4 rounded-xl border border-primary/40 text-primary font-semibold whitespace-nowrap hover:bg-primary/10 transition-colors"
              >
                Mesclar
              </button>
              <button
                onClick={() => applyImport('replace')}
                className="w-full sm:flex-1 min-w-0 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-dim text-white font-semibold whitespace-nowrap transition-colors"
              >
                Substituir tudo
              </button>
            </div>
          </div>
        )}
      </Modal>

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

function SummaryRow({ label, value }: { label: string; value: { kept: number; skipped: number } }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-text font-medium">
        {value.kept}
        {value.skipped > 0 && <span className="text-red-400 font-normal"> · {value.skipped} ignorados</span>}
      </span>
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
