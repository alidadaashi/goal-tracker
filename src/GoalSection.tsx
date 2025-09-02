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
}

export const GoalSection = ({
  title,
  period,
  goals,
  onAddGoal,
  onToggleGoal,
  onEditGoal,
  onDeleteGoal
}: GoalSectionProps) => {
  const [newGoalText, setNewGoalText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const completedCount = goals.filter(goal => goal.completed).length;
  const totalCount = goals.length;
  const signalCount = goals.filter(goal => goal.type === 'signal').length;
  const noiseCount = goals.filter(goal => goal.type === 'noise').length;

  return (
    <div className={`bg-gray-50 rounded-xl p-6 transition-all duration-300 ${isCollapsed ? 'w-16' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={isCollapsed ? 'Expand column' : 'Collapse column'}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-90' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {!isCollapsed && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
        </div>
        
        {!isCollapsed && (
          <div className="text-sm text-gray-600">
            <div>{completedCount}/{totalCount} completed</div>
            <div className="flex gap-3 mt-1">
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
        )}
      </div>

      {isCollapsed && (
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-2 transform -rotate-90 whitespace-nowrap">
            {title.replace(' Goals', '')}
          </div>
          <div className="text-xs text-gray-400">
            {totalCount}
          </div>
        </div>
      )}

      {!isCollapsed && (
        <>
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
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};