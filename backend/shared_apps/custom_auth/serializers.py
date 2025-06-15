from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add user fields
        token['email'] = user.email
        token['role'] = user.role
        print(user.role)

        # Access tenant directly from user
        if user.tenant:
            token['tenant_id'] = user.tenant.id
            token['tenant_name'] = user.tenant.name
            token['is_tenant_admin'] = user.is_tenant_admin()
        else:
            token['tenant_id'] = None
            token['tenant_name'] = None
            token['is_tenant_admin'] = False

        return token
