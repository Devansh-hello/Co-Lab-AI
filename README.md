# Co-Lab-AI

Co-Lab-AI is an intelligent, agentic coding assistant platform designed to accelerate software development. It leverages a multi-agent AI system to analyze requirements, coordinate tasks, and generate full-stack applications (Frontend + Backend + Documentation) in real-time.

## 🚀 Features

-   **Multi-Agent Architecture**:
    -   **Coordinator Agent**: Orchestrates the development process, breaking down user requests into actionable technical plans.
    -   **Frontend Agent**: Generates production-ready React code with modern styling.
    -   **Backend Agent**: Creates robust Node.js/Express APIs and database schemas.
    -   **Documentation Agent**: Automatically authors comprehensive documentation for generated projects.
-   **Real-time Streaming**: Utilizes WebSockets to stream AI responses and code generation updates instantly to the user.
-   **Project Management**: Organize work into "Projects" with dedicated chat contexts and specific requirements.
-   **Modern Tech Stack**: Built with the latest web technologies for performance and scalability.

## 🛠️ Technology Stack

### Frontend (`CoLab AI Frontend`)
-   **Framework**: [React 19](https://react.dev/)
-   **Build Tool**: [Vite 7](https://vitejs.dev/)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **HTTP Client**: Axios
-   **UI Components**: Radix UI primitives, framer-motion

### Backend (`CoLab AI Backend`)
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express](https://expressjs.com/)
-   **Language**: TypeScript
-   **Database**: [MongoDB](https://www.mongodb.com/) (ODM: Mongoose)
-   **Real-time**: [ws](https://www.npmjs.com/package/ws) (WebSocket)
-   **AI Integration**: OpenAI SDK (connected to OpenRouter / x-ai models)
-   **Validation**: Zod

## 🏁 Getting Started

### Prerequisites
-   **Node.js** (v20+ recommended)
-   **MongoDB** (Local instance or Atlas URI)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd Co-Lab-AI
    ```

2.  **Backend Setup**
    ```bash
    cd "CoLab AI Backend"
    npm install
    ```

    Create a `.env` file in the backend directory (see [Environment Variables](#-environment-variables) below).

    Start the backend server:
    ```bash
    npm run dev
    ```
    *The server runs on port 5000 (HTTP) and 8080 (WebSocket).*

3.  **Frontend Setup**
    Open a new terminal:
    ```bash
    cd "CoLab AI Frontend"
    npm install
    ```

    Start the development server:
    ```bash
    npm run dev
    ```
    *Access the app at `http://localhost:5173`.*

## 🔐 Environment Variables

You must configure the backend environment variables for the application to function.

Create a `.env` file in **`CoLab AI Backend/`**:

```ini
# Database Connection
DATABASE_URL="mongodb://localhost:27017/colab"

# AI Provider (OpenRouter / x-ai)
OPENROUTER_API_KEY="your_openrouter_api_key_here"

# JWT Secret (for Authentication)
# Note: Currently hardcoded in index.ts for dev, but best practice is to move it here.
JWT_SECRET="your_jwt_secret" 
```

## 🏗️ Project Structure

```
Co-Lab-AI/
├── CoLab AI Backend/       # Express + WebSocket Server
│   ├── src/
│   │   ├── index.ts        # HTTP Server Entry & API Routes
│   │   ├── function.ts     # AI Agent Logic (Coordinator, Frontend, Backend)
│   │   ├── db.ts           # Database Connection & Models
│   │   └── middleware.ts   # Auth & Validation Middleware
│   └── dist/               # Compiled JS
│
└── CoLab AI Frontend/      # React + Vite Application
    ├── src/
    │   ├── components/     # UI Components
    │   ├── pages/          # Route Pages
    │   └── hooks/          # Custom React Hooks
    └── package.json
```
