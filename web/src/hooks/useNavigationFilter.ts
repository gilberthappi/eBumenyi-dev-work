import { useMemo } from "react";
import { usePermission } from "./usePermission";
import { UserRole, UserIndustry } from "@/types";

export interface NavLink {
  label: string;
  path?: string;
  icon?: JSX.Element;
  submenus?: NavLink[];
  roles?: UserRole[];
  industries?: UserIndustry[];
}

// Custom hook to filter navigation links based on permissions
export const useNavigationFilter = (links: NavLink[]): NavLink[] => {
  // We need to call usePermission for each link at the top level
  // Create a flat list of all permission checks needed
  const permissionChecks = useMemo(() => {
    const checks: Array<{
      linkIndex: number;
      submenuIndex?: number;
      roles?: UserRole[];
      industries?: UserIndustry[];
    }> = [];

    links.forEach((link, linkIndex) => {
      // Add parent link check
      checks.push({
        linkIndex,
        roles: link.roles,
        industries: link.industries,
      });

      // Add submenu checks
      if (link.submenus) {
        link.submenus.forEach((_, submenuIndex) => {
          checks.push({
            linkIndex,
            submenuIndex,
            roles: link.submenus![submenuIndex].roles,
            industries: link.submenus![submenuIndex].industries,
          });
        });
      }
    });

    return checks;
  }, [links]);

  // Call usePermission for all checks (must be at top level)
  const permissions = permissionChecks.map((check) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePermission({
      allowedRoles: check.roles,
      allowedIndustries: check.industries,
      requireAll: true,
    })
  );

  // Build filtered links using the permission results
  const filteredLinks = useMemo(() => {
    let checkIndex = 0;
    
    return links
      .map((link) => {
        // Get permission for parent link
        const linkPermission = permissions[checkIndex++];
        
        if (!linkPermission.hasPermission) {
          // Skip submenus in the check index
          if (link.submenus) {
            checkIndex += link.submenus.length;
          }
          return null;
        }

        // Filter submenus if they exist
        if (link.submenus && link.submenus.length > 0) {
          const filteredSubmenus = link.submenus.filter(() => {
            const submenuPermission = permissions[checkIndex++];
            return submenuPermission.hasPermission;
          });

          return {
            ...link,
            submenus: filteredSubmenus,
          };
        }

        return link;
      })
      .filter((link): link is NavLink => link !== null);
  }, [links, permissions]);

  return filteredLinks;
};
