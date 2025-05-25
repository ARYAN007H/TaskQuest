

import { useState, useEffect, useCallback } from 'react';
import { PomodoroSettings, PomodoroPhase } from './types';
import { DEFAULT_POMODORO_SETTINGS } from './constants';

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);


  return [storedValue, setValue];
}

export function usePomodoro(initialSettings: PomodoroSettings = DEFAULT_POMODORO_SETTINGS) {
  const [settings, setSettings] = useLocalStorage<PomodoroSettings>('pomodoroSettings', initialSettings);
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [phase, setPhase] = useState<PomodoroPhase>(PomodoroPhase.WORK);
  const [isActive, setIsActive] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    setTimeLeft(settings.workMinutes * 60); // Reset time left if settings change
    setPhase(PomodoroPhase.WORK);
    setIsActive(false);
    setCyclesCompleted(0);
  }, [settings]);

  useEffect(() => {
    // Fix: Changed NodeJS.Timeout to number, as setInterval in browser returns a number.
    let intervalId: number | null = null;

    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // End of phase
      setIsActive(false); 
      // TODO: Add notification sound here
      if (phase === PomodoroPhase.WORK) {
        const newCyclesCompleted = cyclesCompleted + 1;
        setCyclesCompleted(newCyclesCompleted);
        if (newCyclesCompleted % settings.cyclesBeforeLongBreak === 0) {
          setPhase(PomodoroPhase.LONG_BREAK);
          setTimeLeft(settings.longBreakMinutes * 60);
        } else {
          setPhase(PomodoroPhase.SHORT_BREAK);
          setTimeLeft(settings.shortBreakMinutes * 60);
        }
      } else { // End of a break
        setPhase(PomodoroPhase.WORK);
        setTimeLeft(settings.workMinutes * 60);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, timeLeft, phase, cyclesCompleted, settings]);

  const startTimer = useCallback(() => setIsActive(true), []);
  const pauseTimer = useCallback(() => setIsActive(false), []);
  
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setPhase(PomodoroPhase.WORK);
    setTimeLeft(settings.workMinutes * 60);
    setCyclesCompleted(0);
  }, [settings]);

  const skipPhase = useCallback(() => {
    setIsActive(false);
    if (phase === PomodoroPhase.WORK) {
      const newCyclesCompleted = cyclesCompleted + 1;
      setCyclesCompleted(newCyclesCompleted);
      if (newCyclesCompleted % settings.cyclesBeforeLongBreak === 0) {
        setPhase(PomodoroPhase.LONG_BREAK);
        setTimeLeft(settings.longBreakMinutes * 60);
      } else {
        setPhase(PomodoroPhase.SHORT_BREAK);
        setTimeLeft(settings.shortBreakMinutes * 60);
      }
    } else { // End of a break
      setPhase(PomodoroPhase.WORK);
      setTimeLeft(settings.workMinutes * 60);
    }
  }, [phase, cyclesCompleted, settings]);


  const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    timeLeft,
    phase,
    isActive,
    cyclesCompleted,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    skipPhase,
    updateSettings,
  };
}