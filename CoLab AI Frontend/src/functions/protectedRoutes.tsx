import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const ProctectedRoutes = () => {

    const {user} = useAuth()
    return user ? <Outlet/> : <Navigate to = "/login" />
};

export default ProctectedRoutes;