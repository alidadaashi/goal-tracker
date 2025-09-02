import { useGoals } from './hooks';
import { GoalSection } from './GoalSection';
import { getDateInfo } from './dateUtils';

function App() {
  const { goals, addGoal, toggleGoal, editGoal, deleteGoal } = useGoals();
  const dateInfo = getDateInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Goal Tracker</h1>
          <p className="text-gray-600">Organize your daily, weekly, monthly, and quarterly goals</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <GoalSection
            title={dateInfo.quarterly}
            period="quarterly"
            goals={goals.quarterly}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
          />
          
          <GoalSection
            title={dateInfo.monthly}
            period="monthly"
            goals={goals.monthly}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
          />
          
          <GoalSection
            title={dateInfo.weekly}
            period="weekly"
            goals={goals.weekly}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
          />
          
          <GoalSection
            title={dateInfo.daily}
            period="daily"
            goals={goals.daily}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
          />
        </div>
      </div>
    </div>
  );
}

export default App;