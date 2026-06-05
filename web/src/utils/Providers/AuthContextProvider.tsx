// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useIsAuthenticated, useAuthUser } from "react-auth-kit";
// import { Navigate } from "react-router-dom";
// import { ReactNode } from "react";
// import { UserRole, UserIndustry } from "@/types";

// // Legacy route guards - kept for backward compatibility
// // Recommended: Use ProtectedRoute from @/components/common/ProtectedRoute instead

// const RoleBasedRoute = ({
//   children,
//   allowedRoles,
// }: {
//   children: ReactNode;
//   allowedRoles: UserRole[];
// }) => {
//   const isAuthenticated = useIsAuthenticated();
//   const auth = useAuthUser();

//   if (!isAuthenticated()) {
//     return <Navigate to='/auth/login' replace />;
//   }

//   if (!auth()?.roles?.some((role: any) => allowedRoles.includes(role))) {
//     return <Navigate to='/forbidden' replace />;
//   }

//   return children;
// };

// const IndustryBasedRoute = ({
//   children,
//   allowedIndustries,
// }: {
//   children: ReactNode;
//   allowedIndustries: UserIndustry[];
// }) => {
//   const isAuthenticated = useIsAuthenticated();
//   const auth = useAuthUser();

//   if (!isAuthenticated()) {
//     return <Navigate to='/auth/login' replace />;
//   }

//   const userIndustry = auth()?.industry;
//   if (userIndustry && !allowedIndustries.includes(userIndustry)) {
//     return <Navigate to='/forbidden' replace />;
//   }

//   return children;
// };

// const RoleAndIndustryBasedRoute = ({
//   children,
//   allowedRoles,
//   allowedIndustries,
// }: {
//   children: ReactNode;
//   allowedRoles: UserRole[];
//   allowedIndustries?: UserIndustry[];
// }) => {
//   const isAuthenticated = useIsAuthenticated();
//   const auth = useAuthUser();

//   if (!isAuthenticated()) {
//     return <Navigate to='/auth/login' replace />;
//   }

//   // Check role permission
//   if (!auth()?.roles?.some((role: any) => allowedRoles.includes(role))) {
//     return <Navigate to='/forbidden' replace />;
//   }

//   // Check industry permission if specified
//   if (allowedIndustries && allowedIndustries.length > 0) {
//     const userIndustry = auth()?.industry;
//     if (userIndustry && !allowedIndustries.includes(userIndustry)) {
//       return <Navigate to='/forbidden' replace />;
//     }
//   }

//   return children;
// };

// export { RoleBasedRoute, IndustryBasedRoute, RoleAndIndustryBasedRoute };

