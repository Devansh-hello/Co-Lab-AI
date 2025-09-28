import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RouterProvider } from 'react-router-dom';
import MainLoadingScreen from './MainLoadingScreen';

interface AppWrapperProps {
  router: any; // Replace with proper router type
}

const AppWrapper: React.FC<AppWrapperProps> = ({ router }) => {
  const { isInitialized } = useAuth();

  if (!isInitialized) {
    return <MainLoadingScreen />;
  }

  return <RouterProvider router={router} />;
};

export default AppWrapper;