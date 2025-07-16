from rest_framework.permissions import BasePermission

class IsTenantAdmin(BasePermission):
    """
    Allows access only to users with role 'tenant_admin'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_tenant_admin()