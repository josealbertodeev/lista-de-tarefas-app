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
import { Confetti } from './components/common/Confetti';
import { useProfileStore } from './stores/useProfileStore';

export type AppView = 'dashboard' | 'kanban' | 'calendar' | 'gantt' | 'goals' | 'settings';

function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const setTheme = useProfileStore((s) => s.setTheme);
  const theme = useProfileStore((s) => s.profile.theme);

  useEffect(() => {
    setTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setView('dashboard');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <PomodoroEngine />
      <Confetti />
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
