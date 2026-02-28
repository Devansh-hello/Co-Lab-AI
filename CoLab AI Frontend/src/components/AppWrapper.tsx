import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RouterProvider, type Router } from 'react-router-dom';
import MainLoadingScreen from './MainLoadingScreen';

interface AppWrapperProps {
  router: Router;
}

const AppWrapper: React.FC<AppWrapperProps> = ({ router }) => {
  const { isInitialized } = useAuth();

  if (!isInitialized) {
    return <MainLoadingScreen />;
  }

  return <RouterProvider router={router} />;
};

export default AppWrapper;