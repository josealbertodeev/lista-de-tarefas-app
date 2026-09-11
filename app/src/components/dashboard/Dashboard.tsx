import { WelcomeBanner } from './WelcomeBanner';
import { TaskCreateBox } from './TaskCreateBox';
import { DailyGoalCard } from './DailyGoalCard';
import { TaskList } from './TaskList';
import { PomodoroCard } from './PomodoroCard';
import { UpcomingAppointments } from './UpcomingAppointments';
import { AchievementsCard } from './AchievementsCard';

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <WelcomeBanner />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-8 flex flex-col gap-6">
          <TaskCreateBox />
          <DailyGoalCard />
          <TaskList />
        </section>
        <section className="lg:col-span-4 flex flex-col gap-6">
          <PomodoroCard />
          <UpcomingAppointments />
          <AchievementsCard />
        </section>
      </div>
    </div>
  );
}
