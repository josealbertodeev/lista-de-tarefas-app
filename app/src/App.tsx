import { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { CalendarView } from './components/calendar/CalendarView';
import { GanttChart } from './components/gantt/GanttChart';
import { GoalsStats } from './components/goals/GoalsStats';
import { SettingsProfile } from './components/settings/SettingsProfile';
import { PomodoroEngine } from './components/dashboard/PomodoroEngine';
import { ReminderEngine } from './components/dashboard/ReminderEngine';
import { AchievementEngine } from './components/dashboard/AchievementEngine';
import { Confetti } from './components/common/Confetti';
import { UndoToast } from './components/common/UndoToast';
import { useProfileStore } from './stores/useProfileStore';

export type AppView = 'dashboard' | 'kanban' | 'calendar' | 'gantt' | 'goals' | 'settings';

const VIEWS: AppView[] = ['dashboard', 'kanban', 'calendar', 'gantt', 'goals', 'settings'];

function viewFromHash(): AppView {
  const candidate = window.location.hash.replace('#', '');
  return VIEWS.includes(candidate as AppView) ? (candidate as AppView) : 'dashboard';
}

function App() {
  // A tela vive no hash da URL: isso devolve o botão voltar, faz o F5 manter a
  // tela atual e permite favoritar "#calendar". Um router completo seria exagero
  // para seis telas estáticas.
  const [view, setView] = useState<AppView>(viewFromHash);
  const setTheme = useProfileStore((s) => s.setTheme);
  const theme = useProfileStore((s) => s.profile.theme);

  useEffect(() => {
    setTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (viewFromHash() !== view) window.location.hash = view;
  }, [view]);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        // Antes isto apenas trocava de tela; agora leva o foco ao campo de criação.
        setView('dashboard');
        requestAnimationFrame(() => {
          document.querySelector<HTMLInputElement>('[data-new-task-input]')?.focus();
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <PomodoroEngine />
      <ReminderEngine />
      <AchievementEngine />
      <Confetti />
      <UndoToast />
      <Header view={view} onNavigate={setView} />
      <main className="pt-16 pb-20 md:pb-0">
        {view === 'dashboard' && <Dashboard />}
        {view === 'kanban' && <KanbanBoard />}
        {view === 'calendar' && <CalendarView />}
        {view === 'gantt' && <GanttChart />}
        {view === 'goals' && <GoalsStats />}
        {view === 'settings' && <SettingsProfile />}
      </main>
      <MobileNav view={view} onNavigate={setView} onQuickAdd={() => setView('dashboard')} />
    </div>
  );
}

export default App;
