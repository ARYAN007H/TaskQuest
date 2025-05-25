# TaskQuest: Premium Gamified To-Do List ✨

TaskQuest is a beautifully designed, fun-to-use, and highly functional to-do list application that gamifies your tasks to keep you motivated. It features a premium, Apple-inspired monochromatic UI, smooth animations, and intelligent features powered by the Gemini API.

## 🚀 Features

*   **Premium UI/UX:** Sleek, modern, and responsive design inspired by Apple's aesthetic, with light and dark modes.
*   **AI Assistant (New Task Creation):** Use natural language prompts in the header bar to have the AI create tasks for you, including inferring titles, descriptions, priorities, due dates, and generating relevant sub-tasks.
*   **Task Management:** Create, edit, delete, and prioritize tasks.
*   **Task Decomposition (AI-Powered for Existing Tasks):** Break down complex existing tasks into smaller, actionable sub-tasks using Gemini AI.
*   **Sub-tasks:** Organize your work with parent and child tasks.
*   **XP & Gamification:** Earn Experience Points (XP) for completing tasks.
*   **Global Leaderboard:** See how you rank against other users (mock data).
*   **Calendar View:** Visualize your tasks on a monthly calendar.
*   **Pomodoro Timer:** Boost focus with an integrated Pomodoro timer.
*   **Filtering:** View all, pending, or completed tasks.
*   **Persistent Storage:** Tasks, settings, and your API key (if entered via UI) are saved in your browser's local storage.
*   **Responsive Design:** Works seamlessly on desktop, tablet, and mobile devices.
*   **API Key Management UI:** Input and manage your Gemini API key directly within the app settings.

## 🛠️ Technologies Used

*   **Frontend:** React 19 (via esm.sh CDN), TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **AI:** Google Gemini API (`gemini-2.5-flash-preview-04-17` model for task creation and decomposition)
*   **Icons:** Heroicons (via custom React components)
*   **Structure:** Single `index.html` with ES Modules (`index.tsx`).

## ⚙️ Setup & Running

This project is designed to run directly in the browser without a build step, thanks to ES Modules and CDNs.

**1. Clone the Repository:**

```bash
git clone https://github.com/your-username/taskquest.git
cd taskquest
```

**2. Set up Gemini API Key:**

The application uses the Gemini API for AI-powered features. You'll need an API key. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey).

There are two ways to provide the API key:

   **Method 1: Via the In-App Settings (Recommended for Quick Testing)**
    *   Open `index.html` in your browser (preferably served by a local HTTP server, see below).
    *   Click the **Cog icon (⚙️)** in the header to open the API Key Settings.
    *   Paste your Gemini API key into the input field and click "Save Key".
    *   The key will be stored in your browser's `localStorage`.
    *   **Security Note:** While convenient, storing API keys in `localStorage` is not recommended for production environments. This method is suitable for local development and personal use.

   **Method 2: Using an `.env` file (Conceptual Fallback)**
    *   The application originally intended to use environment variables. While the UI method is now primary, you can conceptually still set this up.
    *   Create a file named `.env` in the root of the project.
    *   Copy the contents of `.env.example` into `.env`:
        ```
        API_KEY=YOUR_GEMINI_API_KEY_HERE
        ```
    *   Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key.
    *   **Note:** For this browser-only setup, making `process.env.API_KEY` directly available to the JavaScript without a build step is non-trivial. The in-app settings method is more straightforward for this project structure. The app will try to use a key from `localStorage` first if set via the UI.

**3. Open in Browser:**

*   It's highly recommended to serve the files using a local HTTP server.

**Recommended: Using a simple HTTP server**

*   If you have Node.js and npm, install `http-server`:
    ```bash
    npm install -g http-server
    ```
*   Run it in the project's root directory:
    ```bash
    http-server . -o
    ```
    Then open the provided URL (e.g., `http://localhost:8080`) in your browser.

## 💡 Dependencies

Dependencies are loaded via CDN using an `importmap` in `index.html`:

*   `react` & `react-dom`: For building the user interface.
*   `@google/genai`: For interacting with the Gemini API.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📜 License

This project is open-source and available under the MIT License. See the `LICENSE` file for more information (though no LICENSE file is explicitly provided in this project yet).

---

Enjoy leveling up your productivity with TaskQuest!
