import { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import { UserRole, UserIndustry } from "@/types";

interface PermissionGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  allowedIndustries?: UserIndustry[];
  requireAll?: boolean;
  fallback?: ReactNode;
  hideIfNoPermission?: boolean;
}

// Component guard that conditionally renders children based on permissions
// Can be used to wrap buttons, sections, or any UI elements
// Example: <PermissionGuard allowedRoles={['ADMIN']}><Button>Delete</Button></PermissionGuard>
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  allowedRoles,
  allowedIndustries,
  requireAll = true,
  fallback = null,
  hideIfNoPermission = true,
}) => {
  const { hasPermission } = usePermission({
    allowedRoles,
    allowedIndustries,
    requireAll,
  });

  if (!hasPermission) {
    return hideIfNoPermission ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};
