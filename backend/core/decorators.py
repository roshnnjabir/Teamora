# core/decorators.py

from functools import wraps
from rest_framework.exceptions import PermissionDenied

def tenant_admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_tenant_admin():
            raise PermissionDenied("You must be a tenant admin.")
        return view_func(request, *args, **kwargs)
    return _wrapped_view