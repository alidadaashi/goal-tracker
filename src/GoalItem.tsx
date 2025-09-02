import { useState } from 'react';
import { Goal, GoalPeriod, TaskType } from './types';

interface GoalItemProps {
  goal: Goal;
  period: GoalPeriod;
  onToggle: (period: GoalPeriod, id: string) => void;
  onEdit: (period: GoalPeriod, id: string, newText: string, newType: TaskType) => void;
  onDelete: (period: GoalPeriod, id: string) => void;
  onDragStart: (goal: Goal, sourcePeriod: GoalPeriod) => void;
}

export const GoalItem = ({ goal, period, onToggle, onEdit, onDelete, onDragStart }: GoalItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(goal.text);
  const [editType, setEditType] = useState<TaskType>(goal.type);

  const handleSave = () => {
    if (editText.trim()) {
      onEdit(period, goal.id, editText, editType);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(goal.text);
    setEditType(goal.type);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const toggleTaskType = () => {
    const newType = goal.type === 'signal' ? 'noise' : 'signal';
    onEdit(period, goal.id, goal.text, newType);
  };

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(goal, period);
    e.dataTransfer.effectAllowed = 'move';
  };

  const getTaskTypeIcon = (type: TaskType) => {
    return type === 'signal' ? (
      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow cursor-move"
      draggable={!isEditing}
      onDragStart={handleDragStart}
    >
      <button
        onClick={toggleTaskType}
        className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
        title={`Click to change to ${goal.type === 'signal' ? 'noise' : 'signal'}`}
      >
        {getTaskTypeIcon(goal.type)}
      </button>
      
      <input
        type="checkbox"
        checked={goal.completed}
        onChange={() => onToggle(period, goal.id)}
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />
      
      {isEditing ? (
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-2 items-center">
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value as TaskType)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="signal">Signal</option>
              <option value="noise">Noise</option>
            </select>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <span className={`block ${goal.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {goal.text}
            </span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(period, goal.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            
          </button>
        </>
      )}
    </div>
  );
};