import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './pages/App.tsx'
import Home from './pages/Home.tsx'
import SignUp from './pages/SignUp.tsx'
import Login from './pages/Login.tsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from './pages/ErrorPage.tsx'
import ProctectedRoutes from "./functions/protectedRoutes.tsx"
import ProjectPage from "./pages/Projects.tsx"
import PluginsPage from "./pages/Plugins.tsx"
import SettingsPage from "./pages/Settings.tsx"
import Benchmarks from "./pages/Benchmarks.tsx"
import { AuthProvider } from './context/AuthContext.tsx'
import { useAuth } from './context/AuthContext.tsx'
import MainLoadingScreen from './components/MainLoadingScreen.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/benchmarks",
    element: <Benchmarks />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/signup",
    element: <SignUp />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    element: <ProctectedRoutes />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/chat/:projectId", element: <App /> },
      { path: "/projects", element: <ProjectPage /> },
      { path: "/plugins", element: <PluginsPage /> },
      { path: "/settings", element: <SettingsPage /> }
    ],
  },
  {
    path: "*",
    element: <ErrorPage />,
  },
]);

const AppContent = () => {
  const { canShowApp } = useAuth();

  return (
    <div className="relative min-h-screen">
      <div
        className={`transition-all duration-500 ease-in-out ${
          canShowApp ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {canShowApp && <RouterProvider router={router} />}
      </div>

      {!canShowApp && <MainLoadingScreen />}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
