import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoutes = () => {
    const { user, isLoading } = useAuth();

    if (isLoading || user === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background bg-grainy">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground font-mono tracking-wider uppercase">
                        Verifying session
                    </span>
                </div>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoutes;