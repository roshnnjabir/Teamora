from rest_framework import serializers, generics
from shared_apps.custom_auth.models import User
from tenant_apps.employee.models import Employee
from core.constants import UserRoles
from django.utils import timezone
from django_tenants.utils import schema_context
from django.db import transaction
from tenant_apps.employee.tasks.email_tasks import send_set_password_email_task, send_role_change_email
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
import re

ALLOWED_EMPLOYEE_ROLES = {
    UserRoles.PROJECT_MANAGER,
    UserRoles.HR,
    UserRoles.DEVELOPER
}


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='employee.full_name', required=False)
    
    job_title = serializers.CharField(source='employee.job_title', read_only=True)
    department = serializers.CharField(source='employee.department', read_only=True)
    date_joined = serializers.DateField(source='employee.date_joined', read_only=True)

    class Meta:
        model = User
        fields = (
            'first_name',
            'last_name',
            'full_name',
            'job_title',
            'department',
            'date_joined',
        )
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def update(self, instance, validated_data):
        user_fields = ['first_name', 'last_name']
        for field in user_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()

        # Update related Employee fields (excluding read-only)
        employee_data = validated_data.get('employee', {})
        for read_only_field in ['job_title', 'department', 'date_joined']:
            employee_data.pop(read_only_field, None)

        employee = instance.employee
        for attr, value in employee_data.items():
            setattr(employee, attr, value)
        employee.save()

        return instance


class EmployeeSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    full_name = serializers.CharField()
    job_title = serializers.CharField()
    department = serializers.CharField()
    role = serializers.ChoiceField(
        choices=[(role.value, role.label) for role in ALLOWED_EMPLOYEE_ROLES],
        write_only=True
    )
    user_role = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'email', 'full_name', 'job_title', 'role', 'user_role', 'department', 'date_joined']
        read_only_fields = ['date_joined']

    def get_user_role(self, obj):
        return obj.user.role

    def validate_role(self, value):
        if value in [UserRoles.SUPER_ADMIN, UserRoles.TENANT_ADMIN]:
            raise serializers.ValidationError("Cannot assign Super Admin or Tenant Admin roles here.")

        if value not in [role.value for role in ALLOWED_EMPLOYEE_ROLES]:
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
            validated_data.pop('role', None)

            with schema_context(tenant.schema_name):
                with transaction.atomic():
                    employee = Employee.objects.create(
                        user=user,
                        **validated_data,
                        date_joined=timezone.now().date()
                    )

            token = default_token_generator.make_token(user)
            send_set_password_email_task.delay(user.id, token)

        return employee

    def update(self, instance, validated_data):
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.job_title = validated_data.get('job_title', instance.job_title)
        instance.department = validated_data.get('department', instance.department)

        # Check if role is changing
        role = validated_data.get('role')
        if role and role != instance.user.role:
            old_role = instance.user.role
            instance.user.role = role
            instance.user.save()

            send_role_change_email.delay(
                full_name=instance.full_name,
                email=instance.user.email,
                old_role=old_role,
                new_role=role,
                tenant_name=instance.user.tenant.name,
            )
        instance.save()
        return instance

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "email": instance.user.email,
            "full_name": instance.full_name,
            "job_title": instance.job_title,
            "role": instance.user.role,
            "department": instance.department,
            "date_joined": instance.date_joined,
        }


class SetPasswordSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, password):
        errors = []

        if len(password) < 8:
            errors.append("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter.")
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one number.")
        if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
            errors.append("Password must contain at least one special character.")

        if errors:
            raise serializers.ValidationError(errors)

        return password

    def validate(self, data):
        uidb64 = data.get("uidb64")
        token = data.get("token")

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError("Invalid user.")
        
        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError("Invalid or expired token.")

        data["user"] = user
        return data

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user