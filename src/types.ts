export type TaskType = 'signal' | 'noise';

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  type: TaskType;
}

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface GoalsByPeriod {
  daily: Goal[];
  weekly: Goal[];
  monthly: Goal[];
  quarterly: Goal[];
}