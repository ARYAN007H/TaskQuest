
import React, { useState, useEffect, useCallback } from 'react';
import { Task, Priority, AppView, TaskFilterStatus, LeaderboardEntry, AiTaskCreationResponse } from './types';
import { PRIORITY_POINTS, APP_NAME } from './constants';
import { useLocalStorage } from './hooks';
import { 
    Header, TaskForm, TaskItem, TaskListControls, Modal, CalendarView, PomodoroView, 
    LeaderboardModal, Button, SubtaskSuggestionModal, ApiKeyModal
} from './components';
// Fix: Import CogIcon from ./icons
import { CogIcon } from './icons';
import { GoogleGenAI } from "@google/genai";

// Attempt to get API_KEY from process.env (might be undefined in direct browser environments)
// This serves as a fallback if nothing is in localStorage.
const envApiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY ? process.env.API_KEY : undefined;

const App: React.FC = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [userScore, setUserScore] = useLocalStorage<number>('userScore', 0); 
  
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>(
    'theme',
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  
  const [apiKey, setApiKey] = useLocalStorage<string>('geminiApiKey', envApiKey || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [geminiAi, setGeminiAi] = useState<GoogleGenAI | null>(null);


  const [activeView, setActiveView] = useState<AppView>('list');
  const [taskFilter, setTaskFilter] = useState<TaskFilterStatus>('all');
  
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // State for task decomposition (existing tasks)
  const [decomposingTask, setDecomposingTask] = useState<Task | null>(null);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<string[]>([]);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [subtaskGenerationError, setSubtaskGenerationError] = useState<string | null>(null);

  // State for AI Assistant (new task creation via prompt)
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAiPrompt, setIsProcessingAiPrompt] = useState(false);
  const [aiPromptError, setAiPromptError] = useState<string | null>(null);
  const [aiPromptSuccessMessage, setAiPromptSuccessMessage] = useState<string | null>(null);


  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (apiKey) {
      try {
        const aiInstance = new GoogleGenAI({ apiKey });
        setGeminiAi(aiInstance);
        console.log("Gemini AI client initialized successfully with stored/provided API key.");
      } catch (error) {
        console.error("Failed to initialize Gemini AI client with stored/provided API key:", error);
        setGeminiAi(null);
         // Optionally, clear the faulty key from localStorage or notify user
         // setApiKey(''); 
         setAiPromptError("Invalid API Key. Please check your settings.");
      }
    } else {
      setGeminiAi(null);
      console.warn("Gemini API Key is not set. AI features will be disabled.");
    }
  }, [apiKey]);


  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };
  
  useEffect(() => {
    const mockLeaderboard: LeaderboardEntry[] = [
      { id: 'currentUserPlaceholderId', name: 'You (Quest Champion)', score: userScore },
      { id: 'player2', name: 'AI Bot Alpha', score: Math.floor(userScore * 0.8) + 50 },
      { id: 'player3', name: 'Task Master Max', score: Math.floor(userScore * 1.1) + 20 },
      { id: 'player4', name: 'Procrasti-Not', score: Math.floor(userScore * 0.5) + 100 },
    ].sort((a, b) => b.score - a.score);
    setLeaderboardData(mockLeaderboard);
  }, [userScore]);


  // --- TASK MANAGEMENT ---
  const handleAddTask = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'points' | 'parentId' | 'userId'>, parentId?: string) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: Date.now(),
      points: PRIORITY_POINTS[taskData.priority] || 10,
      ...(parentId && { parentId }),
    };
    setTasks(prevTasks => [newTask, ...prevTasks].sort((a,b) => b.createdAt - a.createdAt));
    setShowAddTaskModal(false);
    setEditingTask(null);
    return newTask;
  };

  const handleEditTask = (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'points' | 'parentId' | 'userId'>) => {
    if (!editingTask) return; 
    
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === editingTask.id 
          ? { ...task, ...taskData, points: PRIORITY_POINTS[taskData.priority] || 10 } 
          : task
      ).sort((a,b) => b.createdAt - a.createdAt)
    );
    setEditingTask(null);
    setShowAddTaskModal(false);
  };

  const handleToggleComplete = (id: string) => {
    let pointsChange = 0;
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === id) {
          pointsChange = task.completed ? -task.points : task.points;
          return { ...task, completed: !task.completed };
        }
        return task;
      })
    );
    if (pointsChange !== 0) {
        setUserScore(prevScore => Math.max(0, prevScore + pointsChange));
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id && task.parentId !== id));
  };
  
  const handleClearCompleted = () => {
    setTasks(prevTasks => prevTasks.filter(task => !task.completed));
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setShowAddTaskModal(true);
  };

  // --- AI TASK DECOMPOSITION (Existing Tasks) ---
  const handleOpenDecomposeModal = (task: Task) => {
    if (!geminiAi) {
      setSubtaskGenerationError("API Key is not configured. Please set it in the API Key Settings (cog icon).");
      setShowApiKeyModal(true); // Prompt user to set API key
      return;
    }
    setDecomposingTask(task);
    setSuggestedSubtasks([]);
    setSubtaskGenerationError(null);
    fetchSubtaskSuggestionsForExistingTask(task.title);
  };
  
  const fetchSubtaskSuggestionsForExistingTask = async (parentTaskTitle: string) => {
    if (!geminiAi) {
        setSubtaskGenerationError("Gemini AI client not initialized. Check API Key.");
        return;
    }
    setIsGeneratingSubtasks(true);
    setSubtaskGenerationError(null);
    setSuggestedSubtasks([]);

    try {
      const prompt = `Break down the following task into a list of 3 to 5 actionable sub-tasks. Return the sub-tasks as a JSON array of strings, where each string is a concise title for a sub-task. Do not include any explanations, just the JSON array. Task: "${parentTaskTitle}"`;
      
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }
      
      const parsedData = JSON.parse(jsonStr);

      if (Array.isArray(parsedData) && parsedData.every(item => typeof item === 'string')) {
        setSuggestedSubtasks(parsedData);
      } else {
        throw new Error("AI response was not in the expected format (array of strings).");
      }
    } catch (error: any) {
      console.error("Error generating subtasks for existing task:", error);
      setSubtaskGenerationError(error.message || "Failed to generate subtasks from AI. Please check your API Key or try again.");
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const handleAddSelectedSubtasks = (selectedTitles: string[]) => {
    if (!decomposingTask) return;
    selectedTitles.forEach(title => {
      const subtaskData = {
        title,
        priority: decomposingTask.priority || Priority.MEDIUM, 
      };
      handleAddTask(subtaskData, decomposingTask.id);
    });
    setDecomposingTask(null);
  };

  // --- AI ASSISTANT (New Task Creation via Prompt) ---
  const handleAiPromptSubmit = async () => {
    if (!aiPrompt.trim()) return;
    if (!geminiAi) {
      setAiPromptError("API Key is not configured. Please set it in the API Key Settings (cog icon). AI features are disabled.");
      setShowApiKeyModal(true); // Prompt user to set API key
      return;
    }

    setIsProcessingAiPrompt(true);
    setAiPromptError(null);
    setAiPromptSuccessMessage(null);

    const systemInstruction = `You are an AI assistant helping to create tasks for a to-do list application.
Analyze the following user prompt and extract information to create a main task and any relevant sub-tasks.
Your response MUST be a single JSON object with the following structure:
{
  "title": "string (concise main task title, or null if not a task)",
  "description": "string (optional, detailed description if provided in the prompt, otherwise null)",
  "priority": "string ('High', 'Medium', or 'Low', infer this from keywords like 'urgent', 'important', 'soon', 'later', or default to 'Medium')",
  "dueDate": "string (optional, if a date is mentioned, format as YYYY-MM-DD, otherwise null)",
  "subtaskTitles": ["string"] (an array of strings, each being a concise title for a sub-task. If no sub-tasks are appropriate or mentioned, provide an empty array [])
}
Only provide the JSON object in your response. Do not include any other text, explanations, or markdown fences.
If the user prompt is unclear or doesn't seem like a task, return a JSON object with a null title.
Example: "Book flight to Paris for next month and find hotel options" -> 
{
  "title": "Book flight to Paris and find hotel", 
  "description": "Book flight to Paris for next month and find hotel options", 
  "priority": "Medium", 
  "dueDate": null, 
  "subtaskTitles": ["Book flight to Paris", "Find hotel options in Paris"]
}`;
    
    const userContent = `User prompt: "${aiPrompt}"`;

    try {
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ role: "user", parts: [{text: userContent}] }], // Use parts for system instruction potentially
        config: { 
            responseMimeType: "application/json",
            // systemInstruction: systemInstruction, // This structure might be better if API supports it directly, or combine with user prompt.
            // For now, embedding instructions in the user prompt itself for this model/API version.
            // Let's refine the prompt construction.
        },
      });
      
      // Constructing the prompt for generateContent by combining system instruction with user prompt
      const combinedPrompt = `${systemInstruction}\n\nUser prompt to analyze: "${aiPrompt}"`;

      const newResponse = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: combinedPrompt, // Sending combined prompt
        config: { responseMimeType: "application/json" },
      });


      let jsonStr = newResponse.text.trim();
      // No fence removal needed if model is instructed to return raw JSON.
      
      const aiResponse: AiTaskCreationResponse = JSON.parse(jsonStr);

      if (aiResponse.title) {
        const mainTaskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'points' | 'parentId' | 'userId'> = {
          title: aiResponse.title,
          description: aiResponse.description || undefined,
          priority: (aiResponse.priority as Priority) || Priority.MEDIUM, 
          dueDate: aiResponse.dueDate || undefined,
        };
        const newMainTask = handleAddTask(mainTaskData); 
        
        let subtasksCreatedCount = 0;
        if (newMainTask && aiResponse.subtaskTitles && aiResponse.subtaskTitles.length > 0) {
          aiResponse.subtaskTitles.forEach(subTitle => {
            const subtaskData = {
              title: subTitle,
              priority: newMainTask.priority, 
            };
            handleAddTask(subtaskData, newMainTask.id);
            subtasksCreatedCount++;
          });
        }
        setAiPromptSuccessMessage(`Task "${newMainTask.title}" ${subtasksCreatedCount > 0 ? `and ${subtasksCreatedCount} subtask(s) ` : ''}created!`);
        setAiPrompt(''); 
      } else {
        setAiPromptError("AI couldn't determine a task from your prompt. Try rephrasing.");
      }
    } catch (error: any) {
      console.error("Error processing AI prompt:", error);
      setAiPromptError(error.message || "Failed to create task with AI. Please check your API Key or try again.");
    } finally {
      setIsProcessingAiPrompt(false);
    }
  };

  const handleClearAiMessages = () => {
    setAiPromptError(null);
    setAiPromptSuccessMessage(null);
  };

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey); // This will trigger the useEffect to re-initialize geminiAi
  };


  // --- TASK RENDERING LOGIC (Single User) ---
  const taskMap = new Map<string, Task>();
  const tasksByParent = new Map<string, Task[]>();
  tasks.forEach(task => { 
    taskMap.set(task.id, task);
    if (task.parentId) {
      if (!tasksByParent.has(task.parentId)) {
        tasksByParent.set(task.parentId, []);
      }
      tasksByParent.get(task.parentId)!.push(task);
    }
  });

  tasksByParent.forEach(subtaskList => subtaskList.sort((a, b) => a.createdAt - b.createdAt));

  const topLevelFilteredTasks = tasks.filter(task => {
    if (!task.parentId) { 
      if (taskFilter === 'pending') return !task.completed;
      if (taskFilter === 'completed') return task.completed;
      return true;
    }
    return false;
  }).sort((a, b) => b.createdAt - a.createdAt); 
  
  const finalRenderTasks: Task[] = [];
  topLevelFilteredTasks.forEach(task => {
    finalRenderTasks.push(task);
    const subtasks = tasksByParent.get(task.id) || [];
    subtasks.forEach(subtask => {
      let subtaskPassesFilter = true;
      if (taskFilter === 'pending' && subtask.completed) subtaskPassesFilter = false;
      if (taskFilter === 'completed' && !subtask.completed) subtaskPassesFilter = false;
      if (subtaskPassesFilter) finalRenderTasks.push(subtask);
    });
  });

  const pendingTasksCount = tasks.filter(task => !task.completed).length;

  const renderView = () => {
    switch (activeView) {
      case 'list':
        return (
          <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
            <TaskListControls 
              filter={taskFilter} 
              onFilterChange={setTaskFilter} 
              onClearCompleted={handleClearCompleted}
              pendingTasksCount={pendingTasksCount}
            />
            {finalRenderTasks.length === 0 && (
              <div className="text-center py-12 text-text-secondary dark:text-text-secondary-dark">
                <svg className="mx-auto mb-6 w-24 h-24 text-border dark:text-border-dark opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                <h3 className="text-xl font-medium">No tasks here!</h3>
                <p className="mt-1 text-sm">Add a new task or use the AI Assistant above.</p>
                 {!apiKey && <p className="mt-2 text-sm text-warning">AI Assistant requires an API Key. Click the <CogIcon className="inline h-4 w-4 -mt-1"/> icon to set it.</p>}
              </div>
            )}
            <div className="space-y-0">
              {finalRenderTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEdit={openEditModal}
                  onDelete={handleDeleteTask}
                  onDecompose={!task.parentId ? handleOpenDecomposeModal : undefined}
                />
              ))}
            </div>
          </div>
        );
      case 'calendar':
        return (
            <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
                <CalendarView tasks={tasks} onTaskClick={openEditModal} />
            </div>
        );
      case 'pomodoro':
        return (
            <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
                <PomodoroView />
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-background-dark">
      <Header
        appName={APP_NAME}
        userScore={userScore}
        activeView={activeView}
        onNavigate={setActiveView}
        onAddTask={() => { setEditingTask(null); setShowAddTaskModal(true); }}
        onShowLeaderboard={() => setShowLeaderboardModal(true)}
        onShowApiKeySettings={() => setShowApiKeyModal(true)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        // AI Assistant Props
        aiPrompt={aiPrompt}
        onAiPromptChange={setAiPrompt}
        onAiPromptSubmit={handleAiPromptSubmit}
        isProcessingAiPrompt={isProcessingAiPrompt}
        aiPromptError={aiPromptError}
        aiPromptSuccessMessage={aiPromptSuccessMessage}
        onClearAiMessages={handleClearAiMessages}
        hasApiKey={!!apiKey}
      />
      <main className="flex-grow">
        {renderView()}
      </main>
      
      <Modal 
          isOpen={showAddTaskModal} 
          onClose={() => { setShowAddTaskModal(false); setEditingTask(null);}} 
          title={editingTask ? "Edit Quest" : "Add New Quest"}
      >
          <TaskForm 
          onSubmit={editingTask ? handleEditTask : (taskData) => handleAddTask(taskData)} 
          initialData={editingTask ? { title: editingTask.title, description: editingTask.description, dueDate: editingTask.dueDate, priority: editingTask.priority } : undefined}
          onCancel={() => { setShowAddTaskModal(false); setEditingTask(null);}}
          submitButtonText={editingTask ? "Save Changes" : "Add Quest"}
          />
      </Modal>

      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        leaderboardData={leaderboardData}
      />

      {decomposingTask && (
        <SubtaskSuggestionModal
            isOpen={decomposingTask !== null}
            onClose={() => setDecomposingTask(null)}
            parentTask={decomposingTask}
            suggestedSubtasks={suggestedSubtasks}
            isLoading={isGeneratingSubtasks}
            error={subtaskGenerationError}
            onAddSelected={handleAddSelectedSubtasks}
        />
      )}

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        currentApiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      <footer className="text-center py-5 bg-surface/50 dark:bg-surface-dark/50 border-t border-border/30 dark:border-border-dark/30">
        <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
          &copy; {new Date().getFullYear()} {APP_NAME}. Powered by AI.
           {!apiKey && <span className="text-warning ml-2">AI Features Disabled (API Key Missing).</span>}
        </p>
      </footer>
    </div>
  );
};

export default App;
