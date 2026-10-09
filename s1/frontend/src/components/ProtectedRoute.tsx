import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sprout } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isValidating } = useAuth();

  // Wait for token validation to finish before deciding to redirect.
  // Without this, a valid stored token gets cleared mid-render and
  // the user is bounced to /auth even though they were logged in.
  if (isValidating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Sprout className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
