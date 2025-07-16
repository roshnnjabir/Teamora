from rest_framework.permissions import BasePermission

class IsProjectMember(BasePermission):
    """
    Grants access if the user is an active member of this project.
    """
    def has_object_permission(self, request, view, obj):
        employee = request.user.employee
        return obj.members.filter(employee=employee, is_active=True).exists()