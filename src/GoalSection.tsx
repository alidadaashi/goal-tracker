import { useState } from 'react';
import { Goal, GoalPeriod, TaskType } from './types';
import { GoalItem } from './GoalItem';
import { useColumnVisibility } from './hooks/useColumnVisibility';

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
  const { isBlurred, toggleBlurred } = useColumnVisibility(period);

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

  const signalCount = goals.filter(goal => goal.type === 'signal').length;
  const noiseCount = goals.filter(goal => goal.type === 'noise').length;

  return (
    <div 
      className={`flex flex-col bg-white rounded-xl shadow-sm border h-[calc(100vh-7rem)] ${isDragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'border-gray-200'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleBlurred}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={isBlurred ? "Show column content" : "Hide column content"}
            >
              {isBlurred ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m7.071-7.071L19.071 5"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              )}
            </button>
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
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`Add ${period} goal...`}
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddGoal}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
          >
            Add
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-3 min-h-0 transition-all duration-300 ${isBlurred ? 'blur-sm opacity-30' : ''}`}>
        {goals.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No {period} goals yet
          </div>
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