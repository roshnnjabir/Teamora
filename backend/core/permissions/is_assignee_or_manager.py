from rest_framework.permissions import BasePermission
from core.constants import UserRoles

class IsAssigneeOrManager(BasePermission):
    """
    Allows access to project managers, tenant admins, or the developer assigned to the task only.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == UserRoles.TENANT_ADMIN:
            return True
        if user.role == UserRoles.PROJECT_MANAGER:
            return True
        if obj.assigned_to and obj.assigned_to.user_id == user.id:
            return request.method in ['PATCH']
        return False