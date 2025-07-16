from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    """
    Allows access only to users with role 'super_admin(site-admin)'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin()