import { type FC, type ComponentProps } from 'react';
import { useAuth } from '../context/AuthContext';
import { RouterProvider } from 'react-router-dom';
import MainLoadingScreen from './MainLoadingScreen';

interface AppWrapperProps {
  router: ComponentProps<typeof RouterProvider>['router'];
}

const AppWrapper: FC<AppWrapperProps> = ({ router }) => {
  const { isInitialized } = useAuth();

  if (!isInitialized) {
    return <MainLoadingScreen />;
  }

  return <RouterProvider router={router} />;
};

export default AppWrapper;