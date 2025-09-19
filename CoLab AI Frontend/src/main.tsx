import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './pages/App.tsx'
import Home from './pages/Home.tsx'
import SignUp from './pages/SignUp.tsx'
import Login from './pages/Login.tsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import NotFound from './pages/404.tsx'
import { Header } from './components/header.tsx'

const router = createBrowserRouter([
  {path:"/chat", element: <App/>},
  {path:"/", element:<Home/>},
  {path:"/signup", element:<SignUp/>},
  {path:"/login", element:<Login/>},
  {path:"*", element:<NotFound/>}
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
