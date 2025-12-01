import { useAuthStore } from '@/lib/store';

export function usePermission() {
  const { user } = useAuthStore();

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role || !user.role.permissions) {
      return false;
    }

    return user.role.permissions.some(p => p.name === permission);
  };

  const hasPermissionAction = (permissionName: string, action: string): boolean => {
    if (!user || !user.role || !user.role.permissions) {
      return false;
    }

    const permission = user.role.permissions.find(p => p.name === permissionName);
    if (!permission) {
      return false;
    }

    try {
      const actions = JSON.parse(permission.actions || '[]');
      return actions.includes(action);
    } catch {
      return false;
    }
  };

  const hasModuleAccess = (module: string): boolean => {
    if (!user || !user.role || !user.role.permissions) {
      return false;
    }

    return user.role.permissions.some(p => p.module === module);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canPerform = (permissionName: string, action: string): boolean => {
    return hasPermission(permissionName) && hasPermissionAction(permissionName, action);
  };

  const getUserPermissions = () => {
    if (!user || !user.role || !user.role.permissions) {
      return [];
    }
    return user.role.permissions;
  };

  const getPermissionsByModule = () => {
    const permissions = getUserPermissions();
    const grouped: Record<string, typeof permissions> = {};
    
    permissions.forEach(permission => {
      const module = permission.module || 'Other';
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(permission);
    });
    
    return grouped;
  };

  return {
    hasPermission,
    hasPermissionAction,
    hasModuleAccess,
    hasAnyPermission,
    hasAllPermissions,
    canPerform,
    getUserPermissions,
    getPermissionsByModule,
  };
}
