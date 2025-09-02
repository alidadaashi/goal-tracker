import { useState } from 'react';
import { useGoals } from './hooks';
import { GoalSection } from './GoalSection';
import { getDateInfo } from './dateUtils';
import { Goal, GoalPeriod } from './types';

function App() {
  const { goals, addGoal, toggleGoal, editGoal, deleteGoal, moveGoal } = useGoals();
  const dateInfo = getDateInfo();
  const [draggedItem, setDraggedItem] = useState<{ goal: Goal; sourcePeriod: GoalPeriod } | null>(null);

  const handleDragStart = (goal: Goal, sourcePeriod: GoalPeriod) => {
    setDraggedItem({ goal, sourcePeriod });
  };

  const handleDrop = (targetPeriod: GoalPeriod) => {
    if (draggedItem) {
      moveGoal(draggedItem.goal, draggedItem.sourcePeriod, targetPeriod);
      setDraggedItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-8xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Goal Tracker</h1>
          <p className="text-gray-600">Organize your yearly, quarterly, monthly, weekly, and daily goals</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <GoalSection
            title={dateInfo.yearly}
            period="yearly"
            goals={goals.yearly}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
          
          <GoalSection
            title={dateInfo.quarterly}
            period="quarterly"
            goals={goals.quarterly}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
          
          <GoalSection
            title={dateInfo.monthly}
            period="monthly"
            goals={goals.monthly}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
          
          <GoalSection
            title={dateInfo.weekly}
            period="weekly"
            goals={goals.weekly}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
          
          <GoalSection
            title={dateInfo.daily}
            period="daily"
            goals={goals.daily}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onEditGoal={editGoal}
            onDeleteGoal={deleteGoal}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
      </div>
    </div>
  );
}

export default App;