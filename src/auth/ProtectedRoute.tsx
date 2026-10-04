import { Navigate, useLocation } from "react-router-dom";
import { PageSkeleton } from "../components/PageSkeleton";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({
  children,
  requireAccess = false,
  requireVerified = false,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAccess?: boolean;
  requireVerified?: boolean;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (
    (requireVerified || requireAccess) &&
    user.email_verification_required &&
    user.email_verified === false
  ) {
    return <Navigate to="/verify-email" replace />;
  }

  const role = user.account_role ?? "none";
  if (
    (requireAccess || requireVerified) &&
    role === "none" &&
    location.pathname !== "/choose-role"
  ) {
    return <Navigate to="/choose-role" replace />;
  }

  if (requireAccess && user.has_access === false) {
    if (role === "employee") {
      return <Navigate to="/billing" replace />;
    }
    return <Navigate to="/billing" replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
