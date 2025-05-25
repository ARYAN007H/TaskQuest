
import { Priority, PomodoroSettings } from './types';

export const APP_NAME = "TaskQuest";

export const PRIORITY_POINTS: { [key in Priority]: number } = {
  [Priority.LOW]: 10,
  [Priority.MEDIUM]: 20,
  [Priority.HIGH]: 30,
};

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];
    