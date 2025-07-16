from rest_framework.permissions import BasePermission, SAFE_METHODS
from core.constants import UserRoles

class IsProjectReadOnlyOrManager(BasePermission):
    """
    Allows full access to project managers and tenant admins.
    Developers only access safe methods (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Read-only for all authenticated users
        if request.method in SAFE_METHODS:
            return True

        # Only PM or TA can write
        return request.user.role in [
            UserRoles.PROJECT_MANAGER,
            UserRoles.TENANT_ADMIN,
        ]