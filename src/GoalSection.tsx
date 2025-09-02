import { useState } from 'react';
import { Goal, GoalPeriod, TaskType } from './types';
import { GoalItem } from './GoalItem';

interface GoalSectionProps {
  title: string;
  period: GoalPeriod;
  goals: Goal[];
  onAddGoal: (period: GoalPeriod, text: string) => void;
  onToggleGoal: (period: GoalPeriod, id: string) => void;
  onEditGoal: (period: GoalPeriod, id: string, newText: string, newType: TaskType) => void;
  onDeleteGoal: (period: GoalPeriod, id: string) => void;
  onDragStart: (goal: Goal, sourcePeriod: GoalPeriod) => void;
  onDrop: (targetPeriod: GoalPeriod) => void;
}

export const GoalSection = ({
  title,
  period,
  goals,
  onAddGoal,
  onToggleGoal,
  onEditGoal,
  onDeleteGoal,
  onDragStart,
  onDrop
}: GoalSectionProps) => {
  const [newGoalText, setNewGoalText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAddGoal = () => {
    if (newGoalText.trim()) {
      onAddGoal(period, newGoalText);
      setNewGoalText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddGoal();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(period);
  };

  const completedCount = goals.filter(goal => goal.completed).length;
  const totalCount = goals.length;
  const signalCount = goals.filter(goal => goal.type === 'signal').length;
  const noiseCount = goals.filter(goal => goal.type === 'noise').length;

  return (
    <div 
      className={`bg-gray-50 rounded-xl p-6 ${isDragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="text-sm text-gray-600">
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              {signalCount}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              {noiseCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder={`Add a new ${period} goal...`}
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddGoal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {goals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No {period} goals yet. Add one above!</p>
        ) : (
          goals.map(goal => (
            <GoalItem
              key={goal.id}
              goal={goal}
              period={period}
              onToggle={onToggleGoal}
              onEdit={onEditGoal}
              onDelete={onDeleteGoal}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
};