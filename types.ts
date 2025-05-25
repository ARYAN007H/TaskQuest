
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO string for date
  priority: Priority;
  completed: boolean;
  createdAt: number; // timestamp
  points: number;
  parentId?: string; // ID of the parent task
  // userId?: string; // Removed as per previous request
}

export type AppView = 'list' | 'calendar' | 'pomodoro'; // 'profile' removed

export type TaskFilterStatus = 'all' | 'pending' | 'completed';

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
}

export enum PomodoroPhase {
  WORK = 'Work',
  SHORT_BREAK = 'Short Break',
  LONG_BREAK = 'Long Break',
  PAUSED = 'Paused',
}

export interface LeaderboardEntry {
  id: string; 
  name: string;
  score: number;
  rank?: number;
  isCurrentUser?: boolean;
}

// User, AuthProvider, AuthView types were removed in previous step.

// New interface for AI Task Creation
export interface AiTaskCreationResponse {
  title: string | null;
  description?: string | null;
  priority?: 'High' | 'Medium' | 'Low' | null; // AI will return string
  dueDate?: string | null; // Expected format YYYY-MM-DD
  subtaskTitles?: string[] | null;
}
