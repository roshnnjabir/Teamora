from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add user fields
        token['email'] = user.email
        token['role'] = user.role

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


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    role = serializers.CharField()
    is_tenant_admin = serializers.BooleanField()
    name = serializers.CharField()


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        return user