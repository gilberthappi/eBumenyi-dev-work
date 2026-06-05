/* eslint-disable react-hooks/rules-of-hooks */
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useIsAuthenticated } from "react-auth-kit";
import { usePermission } from "@/hooks/usePermission";
import { UserRole, UserIndustry } from "@/types";
import NotFound from "@/pages/NotFound";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  allowedIndustries?: UserIndustry[];
  requireAll?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowedIndustries,
  requireAll = true,
}) => {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" replace />;
  }

  const { hasPermission } = usePermission({
    allowedRoles,
    allowedIndustries,
    requireAll,
  });

  if (!hasPermission) {
    return <NotFound />;
  }

  return <>{children}</>;
};
