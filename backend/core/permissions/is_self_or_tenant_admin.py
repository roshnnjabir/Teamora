from rest_framework.permissions import BasePermission

class IsSelfOrTenantAdmin(BasePermission):
    """
    Allows access if the user is accessing their own data or if it is the tenant admin.
    """
    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_authenticated and (
                obj == request.user or request.user.is_tenant_admin()
            )
        )