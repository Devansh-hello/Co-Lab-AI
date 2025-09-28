import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './pages/App.tsx'
import Home from './pages/Home.tsx'
import SignUp from './pages/SignUp.tsx'
import Login from './pages/Login.tsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import NotFound from './pages/404.tsx'
import ProctectedRoutes from "./functions/protectedRoutes.tsx"
import ProjectPage from "./pages/Projects.tsx"
import { AuthProvider } from './context/AuthContext.tsx'
import AppWrapper from './components/AppWrapper.tsx'
import { useAuth } from './context/AuthContext.tsx'
import MainLoadingScreen from './components/MainLoadingScreen.tsx'

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/login", element: <Login /> },
  {
    element: <ProctectedRoutes />,
    children: [
      { path: "/chat", element: <App /> },
      { path: "/projects", element: <ProjectPage /> }
    ],
  },
  { path: "*", element: <NotFound /> },
]);

const AppContent = () => {
  const { canShowApp, isLoading } = useAuth();

  return (
    <div className="relative min-h-screen">
      {/* Main App Content */}
      <div 
        className={`transition-all duration-500 ease-in-out ${
          canShowApp ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {canShowApp && <RouterProvider router={router} />}
      </div>
      
      {/* Loading Screen */}
      {!canShowApp && (
        <MainLoadingScreen isExiting={!isLoading && canShowApp} />
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </StrictMode>,
);