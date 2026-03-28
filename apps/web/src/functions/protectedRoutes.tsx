import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MainLoadingScreen from "../components/MainLoadingScreen";

const ProtectedRoutes = () => {
    const { user, isLoading } = useAuth();

    if (isLoading || user === null) {
        return <MainLoadingScreen label="Verifying session" />;
    }

    return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoutes;
