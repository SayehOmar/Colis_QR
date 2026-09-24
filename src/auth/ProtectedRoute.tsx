import { Navigate, useLocation } from "react-router-dom";
import { PageSkeleton } from "../components/PageSkeleton";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({
  children,
  requireAccess = false,
}: {
  children: React.ReactNode;
  requireAccess?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAccess && user.has_access === false) {
    return <Navigate to="/billing" replace />;
  }

  return <>{children}</>;
}
