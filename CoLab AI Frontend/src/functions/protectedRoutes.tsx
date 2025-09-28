import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoutes = () => {
    const { user, isLoading } = useAuth();
    
    // Show a smaller loading indicator for route-level loading
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoutes;