from rest_framework.permissions import BasePermission, SAFE_METHODS
from core.constants import UserRoles

class IsAssignedDeveloperOrReadOnly(BasePermission):
    """
    Developers can modify only if assigned. Others can read.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if request.method in SAFE_METHODS:
            return True
        if user.is_tenant_admin() or user.role == UserRoles.PROJECT_MANAGER:
            return True
        return obj.assigned_to and obj.assigned_to.user == user