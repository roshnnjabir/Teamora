from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class TenantJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get("access_token")

        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)  # expects "Bearer <token> from postman"

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)

        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            raise AuthenticationFailed("Tenant not found in request.")

        if user.tenant_id != tenant.id:
            raise AuthenticationFailed("User does not belong to this tenant.")

        return (user, validated_token)