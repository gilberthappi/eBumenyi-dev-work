const appPersmissions = [
  {
    group: "ADMIN",
    permissions: ["ALL"],
  },
] as const;

export type GroupedPermissions = typeof appPersmissions;
export type PermissionsGroups = GroupedPermissions[number];
export type PermissionGroup = GroupedPermissions[number]["group"];
export type Permission = GroupedPermissions[number]["permissions"][number];

export default appPersmissions;
