import React, { useState, useEffect, useCallback } from 'react';
import { Task, Priority, AppView, TaskFilterStatus, PomodoroPhase, LeaderboardEntry, AiTaskCreationResponse } from './types'; // User, AuthView, AuthProvider removed
import { PRIORITY_POINTS, DAYS_OF_WEEK, MONTH_NAMES } from './constants';
import { 
    PlusIcon, EditIcon, TrashIcon, CheckIcon, CalendarIcon, ClockIcon, StarIcon, 
    ChevronLeftIcon, ChevronRightIcon, ListBulletIcon, PlayIcon, PauseIcon, StopIcon, 
    XMarkIcon, TrophyIcon, SparklesIcon, LoadingSpinner, SunIcon, MoonIcon, CogIcon
    // UserCircleIcon, LoginIcon, LogoutIcon, GoogleIcon, GitHubIcon removed
} from './icons';
import { usePomodoro } from './hooks';

// UI Elements
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'plain';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', leftIcon, rightIcon, fullWidth, isLoading, ...props }) => {
  const baseStyles = "font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-background-dark focus-visible:ring-primary/50 transition-all duration-150 ease-in-out inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-primary text-white hover:bg-primary-dark shadow-subtle focus:ring-primary",
    secondary: "bg-surface-dark text-text-primary-dark dark:bg-surface dark:text-text-primary hover:bg-opacity-80 dark:hover:bg-opacity-90 shadow-subtle focus:ring-primary",
    danger: "bg-danger text-white hover:bg-danger-dark shadow-subtle focus:ring-danger",
    ghost: "text-primary hover:bg-primary/10 dark:hover:bg-primary/20 focus:ring-primary",
    outline: "border border-border dark:border-border-dark text-text-secondary dark:text-text-secondary-dark hover:bg-surface-dark/5 dark:hover:bg-surface/5 focus:ring-primary focus:border-primary",
    plain: "text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary focus:text-primary"
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-[0.9375rem]", 
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`} {...props} disabled={props.disabled || isLoading}>
      {isLoading && <LoadingSpinner className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
      {!isLoading && leftIcon && <span className={`mr-2 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`}>{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className={`ml-2 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`}>{rightIcon}</span>}
    </button>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideTitle?: boolean;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', hideTitle = false, footer }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div 
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hideTitle ? undefined : "modal-title"}
    >
      <div 
        className={`bg-surface dark:bg-surface-dark rounded-xl shadow-subtle-lg w-full ${sizeClasses[size]} transform transition-all animate-slide-in-up relative flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideTitle && (
            <div className="flex justify-between items-center p-5 border-b border-border dark:border-border-dark">
            <h3 id="modal-title" className="text-xl font-semibold text-text-primary dark:text-text-primary-dark">{title}</h3>
            <Button variant="plain" size="sm" onClick={onClose} aria-label="Close modal" className="!p-1 text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark">
                <XMarkIcon className="h-6 w-6" />
            </Button>
            </div>
        )}
        {hideTitle && (
             <Button variant="plain" size="sm" onClick={onClose} aria-label="Close modal" className="!p-1 text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark absolute top-3 right-3 z-10">
                <XMarkIcon className="h-6 w-6" />
            </Button>
        )}
        <div className="p-5 overflow-y-auto flex-grow styled-scrollbar"> 
            {children}
        </div>
        {footer && (
          <div className="p-5 border-t border-border dark:border-border-dark">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const inputBaseStyles = "w-full px-3 py-2.5 text-sm bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-md shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary dark:text-text-primary-dark placeholder-text-disabled dark:placeholder-text-disabled-dark transition-colors";
const labelBaseStyles = "block text-xs font-medium text-text-secondary dark:text-text-secondary-dark mb-1";

// App Components

interface AiAssistantBarProps {
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  onAiPromptSubmit: () => void;
  isProcessingAiPrompt: boolean;
  aiPromptError: string | null;
  aiPromptSuccessMessage: string | null;
  onClearAiMessages: () => void;
}

export const AiAssistantBar: React.FC<AiAssistantBarProps> = ({
  aiPrompt,
  onAiPromptChange,
  onAiPromptSubmit,
  isProcessingAiPrompt,
  aiPromptError,
  aiPromptSuccessMessage,
  onClearAiMessages,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiPrompt.trim() && !isProcessingAiPrompt) {
      onAiPromptSubmit();
    }
  };

  useEffect(() => {
    let timer: number;
    if (aiPromptError || aiPromptSuccessMessage) {
      timer = window.setTimeout(() => {
        onClearAiMessages();
      }, 5000); // Clear message after 5 seconds
    }
    return () => clearTimeout(timer);
  }, [aiPromptError, aiPromptSuccessMessage, onClearAiMessages]);

  return (
    <div className="w-full order-first sm:order-none sm:w-auto sm:flex-1 sm:max-w-xl lg:max-w-2xl my-2 sm:my-0 sm:mx-4">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => onAiPromptChange(e.target.value)}
          placeholder="Ask AI to create tasks (e.g., 'Plan my weekend trip with subtasks for packing and booking')"
          className={`${inputBaseStyles} !py-3 pl-4 pr-28 sm:pr-32 text-sm`}
          disabled={isProcessingAiPrompt}
          aria-label="AI Assistant Prompt"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="!absolute right-1.5 top-1/2 -translate-y-1/2 !py-2 px-2.5 sm:px-3"
          isLoading={isProcessingAiPrompt}
          disabled={isProcessingAiPrompt || !aiPrompt.trim()}
          aria-label="Create tasks with AI"
        >
          <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline ml-1.5">AI Create</span>
        </Button>
      </form>
      {isProcessingAiPrompt && (
        <p className="text-xs text-primary dark:text-primary-light mt-1 text-center sm:text-left">AI is thinking...</p>
      )}
      {aiPromptError && (
        <p className="text-xs text-danger dark:text-danger-light mt-1 text-center sm:text-left">{aiPromptError}</p>
      )}
      {aiPromptSuccessMessage && (
        <p className="text-xs text-success dark:text-success-light mt-1 text-center sm:text-left">{aiPromptSuccessMessage}</p>
      )}
    </div>
  );
};


interface HeaderProps {
  appName: string;
  userScore: number; 
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onAddTask: () => void;
  onShowLeaderboard: () => void;
  onShowApiKeySettings: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  // AI Assistant Props
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  onAiPromptSubmit: () => void;
  isProcessingAiPrompt: boolean;
  aiPromptError: string | null;
  aiPromptSuccessMessage: string | null;
  onClearAiMessages: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    appName, userScore, activeView, onNavigate, 
    onAddTask, onShowLeaderboard, onShowApiKeySettings,
    isDarkMode, toggleDarkMode,
    aiPrompt, onAiPromptChange, onAiPromptSubmit, isProcessingAiPrompt,
    aiPromptError, aiPromptSuccessMessage, onClearAiMessages,
    hasApiKey
}) => {
  const navItems: { view: AppView; label: string; icon: React.ReactNode }[] = [
    { view: 'list', label: 'Tasks', icon: <ListBulletIcon className="w-5 h-5" /> },
    { view: 'calendar', label: 'Calendar', icon: <CalendarIcon className="w-5 h-5" /> },
    { view: 'pomodoro', label: 'Timer', icon: <ClockIcon className="w-5 h-5" /> },
  ];

  return (
    <header className="bg-surface/80 dark:bg-surface-dark/80 backdrop-blur-md text-text-primary dark:text-text-primary-dark p-3 sm:p-4 shadow-subtle sticky top-0 z-40 border-b border-border/50 dark:border-border-dark/50">
      <div className="container mx-auto flex flex-wrap justify-between items-center gap-3 sm:gap-4">
        <div className="flex items-center">
            <TrophyIcon className="w-7 h-7 text-warning mr-2"/>
            <h1 className="text-2xl font-semibold tracking-tight">{appName}</h1>
        </div>
        
        <AiAssistantBar
            aiPrompt={aiPrompt}
            onAiPromptChange={onAiPromptChange}
            onAiPromptSubmit={onAiPromptSubmit}
            isProcessingAiPrompt={isProcessingAiPrompt}
            aiPromptError={aiPromptError}
            aiPromptSuccessMessage={aiPromptSuccessMessage}
            onClearAiMessages={onClearAiMessages}
        />

        <nav className="flex space-x-1 bg-background dark:bg-background-dark p-1 rounded-lg shadow-inner order-last sm:order-none w-full sm:w-auto justify-center mt-2 sm:mt-0">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                ${activeView === item.view 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark hover:text-text-primary dark:hover:text-text-primary-dark'}`}
                aria-current={activeView === item.view ? "page" : undefined}
            >
              {item.icon}
              <span className="ml-1.5 hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
                onClick={onShowLeaderboard}
                className="flex items-center bg-warning/10 dark:bg-warning/20 px-3 py-1.5 rounded-lg shadow-sm hover:bg-warning/20 dark:hover:bg-warning/30 transition-colors"
                aria-label="View leaderboard"
            >
                <StarIcon className="w-5 h-5 text-warning mr-1.5" />
                <span className="font-semibold text-sm text-warning-dark dark:text-warning-light">{userScore} XP</span>
            </button>
             <Button 
                variant="plain" 
                size="sm" 
                onClick={toggleDarkMode} 
                className="!p-2 text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary" 
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
                {isDarkMode ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
            </Button>
            <div className="relative">
                <Button 
                    variant="plain" 
                    size="sm" 
                    onClick={onShowApiKeySettings} 
                    className="!p-2 text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary" 
                    aria-label="API Key Settings"
                >
                    <CogIcon className="w-5 h-5"/>
                </Button>
                {!hasApiKey && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-surface dark:ring-surface-dark bg-danger animate-pulse" title="API Key missing"></span>
                )}
            </div>
            <Button 
                onClick={onAddTask} 
                variant="primary" 
                size="md"
                className="shadow-subtle"
                leftIcon={<PlusIcon className="w-5 h-5"/>}
            >
                <span className="hidden sm:inline">New Task</span>
                <span className="sm:hidden">Add</span>
            </Button>
        </div>
      </div>
    </header>
  );
};

interface TaskFormProps {
  onSubmit: (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'points' | 'parentId' | 'userId'>) => void;
  initialData?: Omit<Task, 'id' | 'completed' | 'createdAt' | 'points' | 'parentId' | 'userId'>;
  onCancel: () => void;
  submitButtonText?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, initialData, onCancel, submitButtonText = "Add Task" }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || Priority.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }
    onSubmit({ title, description, dueDate, priority });
  };
  
   useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setDueDate(initialData.dueDate || '');
      setPriority(initialData.priority || Priority.MEDIUM);
    } else {
        setTitle(''); setDescription(''); setDueDate(''); setPriority(Priority.MEDIUM); 
    }
  }, [initialData]);


  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className={labelBaseStyles}>Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputBaseStyles}
          required
          placeholder="e.g., Finish project report"
        />
      </div>
      <div>
        <label htmlFor="description" className={labelBaseStyles}>Description (Optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputBaseStyles}
          placeholder="Add more details..."
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label htmlFor="dueDate" className={labelBaseStyles}>Due Date (Optional)</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputBaseStyles}
            />
        </div>
        <div>
            <label htmlFor="priority" className={labelBaseStyles}>Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={inputBaseStyles}
            >
            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary">{submitButtonText}</Button>
      </div>
    </form>
  );
};

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDecompose?: (task: Task) => void; 
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleComplete, onEdit, onDelete, onDecompose }) => {
  const [showPopEffect, setShowPopEffect] = useState(false);

  const handleComplete = () => {
    onToggleComplete(task.id);
    if (!task.completed) {
        setShowPopEffect(true);
        setTimeout(() => setShowPopEffect(false), 600);
    }
  };
  
  const priorityBorderColor = 
    task.priority === Priority.HIGH ? 'border-danger' :
    task.priority === Priority.MEDIUM ? 'border-warning' :
    'border-success';
  
  const isSubtask = !!task.parentId;

  return (
    <div className={`bg-surface dark:bg-surface-dark shadow-subtle rounded-lg border-l-4 ${priorityBorderColor} mb-3 transition-all duration-200 hover:shadow-subtle-md transform hover:-translate-y-0.5 relative overflow-hidden animate-scale-in ${isSubtask ? 'ml-6 sm:ml-8' : ''}`}>
      <div className="p-4">
        {showPopEffect && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <CheckIcon className="w-16 h-16 text-success/70 animate-confetti-pop" />
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1.5">
              <button 
                  onClick={handleComplete}
                  className={`w-5 h-5 rounded-full border-2 ${task.completed ? 'bg-success border-success' : 'border-border dark:border-border-dark hover:border-primary'} flex items-center justify-center mr-3 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/50 dark:focus:ring-offset-surface-dark transition-all flex-shrink-0`}
                  aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                  aria-pressed={task.completed}
              >
                {task.completed && <CheckIcon className="w-3 h-3 text-white" />}
              </button>
              <h3 
                className={`text-base font-medium ${task.completed ? 'line-through text-text-disabled dark:text-text-disabled-dark' : 'text-text-primary dark:text-text-primary-dark'} truncate cursor-pointer`}
                onClick={() => onEdit(task)}
                title={task.title}
              >
                {task.title}
              </h3>
            </div>
            {task.description && <p className={`text-sm text-text-secondary dark:text-text-secondary-dark mb-2 ml-8 ${task.completed ? 'line-through' : ''} break-words`}>{task.description}</p>}
          </div>
          <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
            {onDecompose && !isSubtask && (
                <Button variant="plain" size="sm" onClick={() => onDecompose(task)} className="!p-1.5" aria-label="Decompose task" title="Decompose Task (AI)">
                    <SparklesIcon className="w-4 h-4 text-text-secondary dark:text-text-secondary-dark hover:text-primary" />
                </Button>
            )}
            <Button variant="plain" size="sm" onClick={() => onEdit(task)} className="!p-1.5" aria-label="Edit task">
              <EditIcon className="w-4 h-4 text-text-secondary dark:text-text-secondary-dark hover:text-primary" />
            </Button>
            <Button variant="plain" size="sm" onClick={() => onDelete(task.id)} className="!p-1.5" aria-label="Delete task">
              <TrashIcon className="w-4 h-4 text-text-secondary dark:text-text-secondary-dark hover:text-danger" />
            </Button>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border/50 dark:border-border-dark/50 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-text-secondary dark:text-text-secondary-dark ml-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
              {task.dueDate && (
                  <div className="flex items-center mb-1 sm:mb-0">
                      <CalendarIcon className="w-3.5 h-3.5 mr-1 text-secondary" />
                      <span>Due: {new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
              )}
              <div className="flex items-center mb-1 sm:mb-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      task.priority === Priority.HIGH ? 'bg-danger/10 text-danger-dark dark:bg-danger/20 dark:text-danger-light' :
                      task.priority === Priority.MEDIUM ? 'bg-warning/10 text-warning-dark dark:bg-warning/20 dark:text-warning-light' :
                      'bg-success/10 text-success-dark dark:bg-success/20 dark:text-success-light'
                  }`}>
                      {task.priority}
                  </span>
              </div>
          </div>
          <div className="flex items-center mt-1 sm:mt-0 text-warning font-semibold">
              <StarIcon className="w-3.5 h-3.5 mr-0.5"/>
              <span>{task.points} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TaskListControlsProps {
  filter: TaskFilterStatus;
  onFilterChange: (filter: TaskFilterStatus) => void;
  onClearCompleted: () => void;
  pendingTasksCount: number;
}

export const TaskListControls: React.FC<TaskListControlsProps> = ({ filter, onFilterChange, onClearCompleted, pendingTasksCount }) => {
  const filters: { status: TaskFilterStatus, label: string }[] = [
      { status: 'all', label: 'All' },
      { status: 'pending', label: 'Pending' },
      { status: 'completed', label: 'Completed' }
    ];
  return (
    <div className="mb-5 p-3 bg-surface dark:bg-surface-dark shadow-subtle rounded-lg flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
      <div className="flex space-x-1 bg-background dark:bg-background-dark p-0.5 rounded-md">
        {filters.map(f => (
          <Button
            key={f.status}
            variant={filter === f.status ? 'secondary' : 'plain'} 
            size="sm"
            onClick={() => onFilterChange(f.status)}
            className={`capitalize ${filter === f.status ? 'shadow-sm text-text-primary dark:text-text-primary-dark' : 'text-text-secondary dark:text-text-secondary-dark'}`}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <div className="text-sm text-text-secondary dark:text-text-secondary-dark">
        {pendingTasksCount} {pendingTasksCount === 1 ? 'task' : 'tasks'} left
      </div>
      <Button variant="danger" size="sm" onClick={onClearCompleted} className="bg-danger/10 text-danger hover:bg-danger/20 dark:bg-danger/20 dark:text-danger-light dark:hover:bg-danger/30">
        Clear Completed
      </Button>
    </div>
  );
};

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [selectedFullDate, setSelectedFullDate] = useState<Date | null>(null);


  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const daysInMonth = [];
  const startDayOfWeek = firstDayOfMonth.getDay(); 

  for (let i = 0; i < startDayOfWeek; i++) {
    daysInMonth.push(null); 
  }
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const handlePrevMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); setSelectedDayTasks([]); setSelectedFullDate(null); }
  const handleNextMonth = () => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); setSelectedDayTasks([]); setSelectedFullDate(null); }
  
  const handleDayClick = (day: Date | null) => {
    if (!day) {
      setSelectedDayTasks([]);
      setSelectedFullDate(null);
      return;
    }
    const tasksForDay = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate + 'T00:00:00'); 
        return taskDate.getFullYear() === day.getFullYear() &&
               taskDate.getMonth() === day.getMonth() &&
               taskDate.getDate() === day.getDate();
    });
    setSelectedDayTasks(tasksForDay);
    setSelectedFullDate(day);
  };


  return (
    <div className="p-4 sm:p-6 bg-surface dark:bg-surface-dark shadow-subtle-md rounded-lg">
        <div className="flex justify-between items-center mb-6">
            <Button onClick={handlePrevMonth} variant="outline" size="sm" leftIcon={<ChevronLeftIcon className="w-4 h-4"/>}>Prev</Button>
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary dark:text-text-primary-dark">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button onClick={handleNextMonth} variant="outline" size="sm" rightIcon={<ChevronRightIcon className="w-4 h-4"/>}>Next</Button>
        </div>
        <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-text-secondary dark:text-text-secondary-dark mb-2">
            {DAYS_OF_WEEK.map(day => <div key={day} className="pb-1">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px">
            {daysInMonth.map((day, index) => {
            const tasksOnThisDay = day ? tasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDate = new Date(task.dueDate + 'T00:00:00'); 
                return taskDate.getFullYear() === day.getFullYear() &&
                       taskDate.getMonth() === day.getMonth() &&
                       taskDate.getDate() === day.getDate();
            }).length : 0;

            const isToday = day && day.toDateString() === new Date().toDateString();
            const isSelected = day && selectedFullDate && day.toDateString() === selectedFullDate.toDateString();

            return (
                <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`h-16 sm:h-20 p-1.5 border border-transparent rounded flex flex-col justify-start items-center cursor-pointer transition-colors duration-150
                    ${day ? 'hover:bg-background dark:hover:bg-background-dark' : 'bg-background/30 dark:bg-background-dark/30 opacity-50'}
                    ${isSelected ? 'bg-primary/10 dark:bg-primary/20 border-primary/30' : ''}
                    ${isToday && !isSelected ? 'border-secondary dark:border-secondary-dark' : ''}
                `}
                role="button"
                tabIndex={day ? 0 : -1}
                aria-label={day ? `Date ${day.getDate()}, ${tasksOnThisDay} tasks` : "Empty date cell"}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDayClick(day);}}
                >
                {day && (
                    <>
                    <span className={`font-medium text-sm ${isToday ? 'text-primary font-semibold' : 'text-text-primary dark:text-text-primary-dark'} ${isSelected ? 'text-primary' : ''}`}>{day.getDate()}</span>
                    {tasksOnThisDay > 0 && (
                        <div className="mt-auto flex items-center justify-center w-full">
                            {[...Array(Math.min(tasksOnThisDay, 3))].map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 ${isSelected ? 'bg-primary/70' : 'bg-secondary/70'} rounded-full mx-0.5`}></div>
                            ))}
                            {tasksOnThisDay > 3 && <span className={`text-xs ${isSelected ? 'text-primary/80' : 'text-secondary/80'}`}>+</span>}
                        </div>
                    )}
                    </>
                )}
                </div>
            );
            })}
        </div>
        {selectedDayTasks.length > 0 && selectedFullDate && (
            <div className="mt-6 pt-4 border-t border-border dark:border-border-dark">
                <h3 className="text-base font-semibold mb-3 text-text-primary dark:text-text-primary-dark">
                    Tasks for {selectedFullDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}:
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 styled-scrollbar">
                    {selectedDayTasks.map(task => (
                        <div key={task.id} onClick={() => onTaskClick(task)} className="p-2.5 bg-background dark:bg-background-dark rounded-md shadow-sm hover:shadow-subtle cursor-pointer transition-shadow">
                            <p className={`font-medium text-sm ${task.completed ? 'line-through text-text-disabled dark:text-text-disabled-dark' : 'text-primary dark:text-primary-light'}`}>{task.title}</p>
                            <p className="text-xs text-text-secondary dark:text-text-secondary-dark">{task.priority} Priority</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export const PomodoroView: React.FC<{}> = () => {
  const { timeLeft, phase, isActive, cyclesCompleted, settings, startTimer, pauseTimer, resetTimer, skipPhase } = usePomodoro();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = () => {
    let totalDuration;
    if (phase === PomodoroPhase.WORK) totalDuration = settings.workMinutes * 60;
    else if (phase === PomodoroPhase.SHORT_BREAK) totalDuration = settings.shortBreakMinutes * 60;
    else totalDuration = settings.longBreakMinutes * 60;
    if (totalDuration === 0) return 0;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };
  
  const phaseConfig = () => {
    switch(phase) {
      case PomodoroPhase.WORK: return { color: 'text-primary', bgColor: 'bg-primary', ringColor: 'ring-primary' };
      case PomodoroPhase.SHORT_BREAK: return { color: 'text-success', bgColor: 'bg-success', ringColor: 'ring-success' };
      case PomodoroPhase.LONG_BREAK: return { color: 'text-warning', bgColor: 'bg-warning', ringColor: 'ring-warning' };
      default: return { color: 'text-secondary', bgColor: 'bg-secondary', ringColor: 'ring-secondary' };
    }
  };
  const currentPhaseConfig = phaseConfig();

  return (
    <div className="p-4 sm:p-6 bg-surface dark:bg-surface-dark shadow-subtle-md rounded-lg flex flex-col items-center space-y-6 max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold text-text-primary dark:text-text-primary-dark">Pomodoro Timer</h2>
      
      <div className="relative w-56 h-56 sm:w-64 sm:h-64">
        <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" className="stroke-current text-border dark:text-border-dark" strokeWidth="8"/>
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            className={`stroke-current ${currentPhaseConfig.color} transition-all duration-500`}
            strokeWidth="8"
            strokeDasharray={Math.PI * 2 * 54}
            strokeDashoffset={Math.PI * 2 * 54 * (1 - progress() / 100)}
            strokeLinecap="round"
            style={{ transitionProperty: 'stroke-dashoffset, stroke', transitionTimingFunction: 'linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-5xl sm:text-6xl font-mono font-bold ${isActive ? currentPhaseConfig.color : 'text-text-primary dark:text-text-primary-dark'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className={`mt-1 px-3 py-0.5 rounded-full text-xs font-medium text-white ${currentPhaseConfig.bgColor}`}>
            {phase}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        {!isActive ? (
          <Button onClick={startTimer} variant="primary" size="lg" className={`${currentPhaseConfig.bgColor} hover:opacity-90`} leftIcon={<PlayIcon className="w-5 h-5" />}>Start</Button>
        ) : (
          <Button onClick={pauseTimer} variant="secondary" size="lg" className="bg-secondary text-white hover:bg-secondary-dark" leftIcon={<PauseIcon className="w-5 h-5" />}>Pause</Button>
        )}
        <Button onClick={resetTimer} variant="outline" size="lg" leftIcon={<StopIcon className="w-5 h-5" />}>Reset</Button>
      </div>
      <Button onClick={skipPhase} variant="plain" size="md" fullWidth rightIcon={<ChevronRightIcon className="w-4 h-4"/>} className="text-sm">Skip Phase</Button>
      
      <div className="text-center text-sm text-text-secondary dark:text-text-secondary-dark">
        <p>Cycles: <span className={`font-semibold ${currentPhaseConfig.color}`}>{cyclesCompleted}</span></p>
        <p className="text-xs mt-1">Work: {settings.workMinutes}m | Short: {settings.shortBreakMinutes}m | Long: {settings.longBreakMinutes}m</p>
      </div>
    </div>
  );
};

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboardData: LeaderboardEntry[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, leaderboardData }) => {
    const sortedLeaderboard = [...leaderboardData]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ 
        ...entry, 
        rank: index + 1,
        isCurrentUser: entry.id === 'currentUserPlaceholderId' 
    }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Leaderboard" size="md">
      <div className="space-y-3">
        {sortedLeaderboard.length > 0 ? sortedLeaderboard.map((entry) => (
          <div 
            key={entry.id} 
            className={`flex items-center justify-between p-3 rounded-lg transition-colors
              ${entry.isCurrentUser 
                ? 'bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/50' 
                : 'bg-background dark:bg-background-dark hover:bg-surface dark:hover:bg-surface-dark'}`}
          >
            <div className="flex items-center">
              <span className={`text-sm font-semibold w-8 text-center mr-3 ${entry.isCurrentUser ? 'text-primary' : 'text-text-secondary dark:text-text-secondary-dark'}`}>
                {entry.rank === 1 && <TrophyIcon className="w-5 h-5 inline-block text-warning -mt-1" />}
                {entry.rank !== 1 && `#${entry.rank}`}
              </span>
              <span className={`font-medium text-sm ${entry.isCurrentUser ? 'text-primary dark:text-primary-light' : 'text-text-primary dark:text-text-primary-dark'}`}>
                {entry.name} {entry.isCurrentUser && "(You)"}
              </span>
            </div>
            <div className="flex items-center">
              <StarIcon className={`w-4 h-4 mr-1 ${entry.isCurrentUser ? 'text-warning' : 'text-warning/70'}`} />
              <span className={`text-sm font-semibold ${entry.isCurrentUser ? 'text-warning-dark dark:text-warning-light' : 'text-text-secondary dark:text-text-secondary-dark'}`}>
                {entry.score} XP
              </span>
            </div>
          </div>
        )) : (
            <p className="text-center text-text-secondary dark:text-text-secondary-dark py-8">Leaderboard is empty. Complete tasks to climb the ranks!</p>
        )}
      </div>
    </Modal>
  );
};

interface SubtaskSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentTask: Task | null;
  suggestedSubtasks: string[];
  isLoading: boolean;
  error: string | null;
  onAddSelected: (selectedTitles: string[]) => void;
}

export const SubtaskSuggestionModal: React.FC<SubtaskSuggestionModalProps> = ({
  isOpen,
  onClose,
  parentTask,
  suggestedSubtasks,
  isLoading,
  error,
  onAddSelected,
}) => {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedSuggestions(new Set()); 
    }
  }, [isOpen]);

  const handleToggleSelection = (title: string) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    onAddSelected(Array.from(selectedSuggestions));
    onClose();
  };
  
  if (!parentTask && isOpen) return null; 

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={parentTask ? `Decompose: ${parentTask.title}` : "Suggest Subtasks"}
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={isLoading || selectedSuggestions.size === 0}
            isLoading={isLoading && suggestedSubtasks.length === 0} 
          >
            Add Selected ({selectedSuggestions.size})
          </Button>
        </div>
      }
    >
      {isLoading && suggestedSubtasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-text-secondary dark:text-text-secondary-dark">
          <LoadingSpinner className="h-8 w-8 mb-3" />
          <p>Generating subtask suggestions with AI...</p>
          <p className="text-xs mt-1">This might take a few seconds.</p>
        </div>
      )}
      {!isLoading && error && (
        <div className="p-4 my-4 bg-danger/10 text-danger-dark dark:text-danger-light border border-danger rounded-md text-sm">
          <p className="font-semibold">Error Generating Subtasks</p>
          <p>{error}</p>
          <p className="mt-2 text-xs">Please check your API Key or try again later.</p>
        </div>
      )}
      {!isLoading && !error && suggestedSubtasks.length === 0 && !parentTask?.title && (
         <p className="text-center text-text-secondary dark:text-text-secondary-dark py-8">No parent task specified for decomposition.</p>
      )}
      {!isLoading && !error && suggestedSubtasks.length === 0 && parentTask?.title && (
         <p className="text-center text-text-secondary dark:text-text-secondary-dark py-8">AI couldn't find any subtasks for this. Try rephrasing the parent task or decomposing manually.</p>
      )}

      {suggestedSubtasks.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto styled-scrollbar pr-2">
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-2">AI has suggested the following subtasks. Select the ones you'd like to add:</p>
          {suggestedSubtasks.map((title, index) => (
            <label
              key={index}
              className="flex items-center p-3 bg-background dark:bg-background-dark rounded-lg hover:bg-surface dark:hover:bg-surface-dark cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                className="h-4 w-4 text-primary border-border dark:border-border-dark rounded focus:ring-primary mr-3"
                checked={selectedSuggestions.has(title)}
                onChange={() => handleToggleSelection(title)}
              />
              <span className="text-sm text-text-primary dark:text-text-primary-dark">{title}</span>
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
};

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, currentApiKey, onSaveApiKey }) => {
  const [inputApiKey, setInputApiKey] = useState(currentApiKey);

  useEffect(() => {
    if (isOpen) {
      setInputApiKey(currentApiKey);
    }
  }, [isOpen, currentApiKey]);

  const handleSave = () => {
    onSaveApiKey(inputApiKey);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gemini API Key Settings"
      size="md"
      footer={
        <div className="flex justify-between items-center">
           <p className="text-xs text-text-secondary dark:text-text-secondary-dark max-w-xs">
            Your API key is stored locally in your browser.
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Key</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="apiKeyInput" className={labelBaseStyles}>
            Enter your Gemini API Key
          </label>
          <input
            type="password" // Use password type to obscure the key visually
            id="apiKeyInput"
            value={inputApiKey}
            onChange={(e) => setInputApiKey(e.target.value)}
            className={inputBaseStyles}
            placeholder="Paste your API key here"
          />
           <p className="mt-2 text-xs text-text-secondary dark:text-text-secondary-dark">
            You can obtain a Gemini API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
          </p>
        </div>
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-md text-warning-dark dark:text-warning-light text-xs">
          <p className="font-semibold mb-1">Important Security Note:</p>
          <p>Pasting API keys directly into a web application and storing them in `localStorage` is generally not recommended for production or shared environments. For deployed applications, prefer using environment variables set during a build process or handled by a secure backend.</p>
        </div>
        {currentApiKey && (
            <p className="text-xs text-success dark:text-success-light">An API key is currently set.</p>
        )}
        {!currentApiKey && (
            <p className="text-xs text-danger dark:text-danger-light">No API key is currently set. AI features will be disabled.</p>
        )}
      </div>
    </Modal>
  );
};
