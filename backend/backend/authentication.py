from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class TenantJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None  # Don't raise — let unauthenticated request pass (handled later)

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        # Validate token and get user
        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

        # Check if user belongs to current tenant
        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            raise AuthenticationFailed("Tenant not found in request.")

        if user.tenant_id != tenant.id:
            raise AuthenticationFailed("User does not belong to this tenant.")

        return (user, validated_token)