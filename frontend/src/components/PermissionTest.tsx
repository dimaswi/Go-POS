import { usePermission } from '@/hooks/usePermission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, X, User, Settings, Home } from 'lucide-react';

export function PermissionTest() {
  const {
    canPerform,
    hasPermission,
    hasModuleAccess,
    getUserPermissions,
    getPermissionsByModule
  } = usePermission();

  const userPermissions = getUserPermissions();
  const permissionsByModule = getPermissionsByModule();

  // Test berbagai permission checks
  const permissionTests = [
    {
      name: 'User Management - Create',
      test: canPerform('user_management', 'create'),
      icon: User,
    },
    {
      name: 'User Management - Read',
      test: canPerform('user_management', 'read'),
      icon: User,
    },
    {
      name: 'Role Management - Assign Permissions',
      test: canPerform('role_management', 'assign_permissions'),
      icon: Shield,
    },
    {
      name: 'System Settings Access',
      test: hasPermission('system_settings'),
      icon: Settings,
    },
    {
      name: 'Dashboard Access',
      test: hasModuleAccess('Dashboard'),
      icon: Home,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Testing Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission Tests */}
          <div>
            <h3 className="text-sm font-medium mb-3">Permission Checks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {permissionTests.map((test, index) => {
                const Icon = test.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{test.name}</span>
                    </div>
                    <Badge variant={test.test ? "default" : "secondary"}>
                      {test.test ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {test.test ? 'Allowed' : 'Denied'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Permissions Summary */}
          <div>
            <h3 className="text-sm font-medium mb-3">User Permissions ({userPermissions.length})</h3>
            <div className="space-y-2">
              {userPermissions.map((permission) => (
                <div key={permission.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{permission.module}</Badge>
                        <span className="text-sm font-medium">{permission.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {JSON.parse(permission.actions || '[]').map((action: string) => (
                        <Badge key={action} variant="secondary" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions by Module */}
          <div>
            <h3 className="text-sm font-medium mb-3">Permissions by Module</h3>
            <div className="space-y-3">
              {Object.entries(permissionsByModule).map(([module, permissions]) => (
                <div key={module} className="border rounded-lg">
                  <div className="bg-muted/30 p-3 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{module}</h4>
                      <Badge variant="outline">{permissions.length} permissions</Badge>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {permissions.map((perm) => (
                      <div key={perm.id} className="flex items-center justify-between">
                        <span className="text-sm">{perm.name}</span>
                        <div className="flex gap-1">
                          {JSON.parse(perm.actions || '[]').map((action: string) => (
                            <Badge key={action} variant="outline" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}