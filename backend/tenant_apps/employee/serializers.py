from rest_framework import serializers, generics
from shared_apps.custom_auth.models import User
from tenant_apps.employee.models import Employee
from core.constants import UserRoles
from django.utils import timezone
from django_tenants.utils import schema_context
from django.db import transaction
from tenant_apps.employee.utils.email import send_set_password_email
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode


ALLOWED_EMPLOYEE_ROLES = {
    UserRoles.PROJECT_MANAGER,
    UserRoles.HR,
    UserRoles.DEVELOPER
}


class EmployeeSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    full_name = serializers.CharField()
    job_title = serializers.CharField()
    department = serializers.CharField()
    role = serializers.ChoiceField(
        choices=[(role, role.label) for role in ALLOWED_EMPLOYEE_ROLES]
    )

    class Meta:
        model = Employee
        fields = ['id', 'email', 'full_name', 'job_title', 'role', 'department', 'date_joined']
        read_only_fields = ['date_joined']

    def validate_role(self, value):
        if value in [UserRoles.SUPER_ADMIN, UserRoles.TENANT_ADMIN]:
            raise serializers.ValidationError("Cannot assign Super Admin or Tenant Admin roles here.")

        if value not in ALLOWED_EMPLOYEE_ROLES:
            raise serializers.ValidationError("Only Project Manager, HR, and Developer roles are allowed.")

        return value

    def create(self, validated_data):
        tenant = self.context['request'].tenant
        email = validated_data.pop('email')

        if not email:
            raise serializers.ValidationError("Email required to create a user.")

        # Check across all tenants for better error feedback
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            if existing_user.tenant == tenant:
                raise serializers.ValidationError("A user with this email already exists in this organization.")
            else:
                raise serializers.ValidationError(
                    f"This email is already registered under a different organization."
                )
        
        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                role=validated_data['role'],
                tenant=tenant
            )
            user.set_unusable_password()
            user.save()

            validated_data.pop('tenant', None)

            with schema_context(tenant.schema_name):
                with transaction.atomic():
                    employee = Employee.objects.create(
                        user=user,
                        **validated_data,
                        date_joined=timezone.now().date()
                    )

            # Send email with password reset link
            send_set_password_email(user)

        return employee

    def update(self, instance, validated_data):
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.job_title = validated_data.get('job_title', instance.job_title)
        instance.department = validated_data.get('department', instance.department)
        instance.role = validated_data.get('role', instance.role)
        instance.save()
        return instance

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "email": instance.user.email,
            "full_name": instance.full_name,
            "job_title": instance.job_title,
            "role": instance.role,
            "department": instance.department,
            "date_joined": instance.date_joined,
        }


class SetPasswordSerializer(serializers.Serializer):
    uid = serializers.IntegerField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate(self, data):
        try:
            user = User.objects.get(pk=data["uid"])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid user ID.")

        if not default_token_generator.check_token(user, data["token"]):
            raise serializers.ValidationError("Invalid or expired token.")

        data["user"] = user
        return data

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user