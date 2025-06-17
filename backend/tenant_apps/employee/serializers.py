from rest_framework import serializers, generics
from shared_apps.custom_auth.models import User
from tenant_apps.employee.models import Employee
from core.constants import UserRoles
from django.utils import timezone
from django_tenants.utils import schema_context
from django.db import transaction


ALLOWED_EMPLOYEE_ROLES = {
    UserRoles.PROJECT_MANAGER,
    UserRoles.HR,
    UserRoles.DEVELOPER
}


class EmployeeSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.CharField()
    job_title = serializers.CharField()
    department = serializers.CharField()
    role = serializers.ChoiceField(
        choices=[(role, role.label) for role in ALLOWED_EMPLOYEE_ROLES]
    )

    class Meta:
        model = Employee
        fields = ['id', 'email', 'password', 'full_name', 'job_title', 'role', 'department', 'date_joined']
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
        password = validated_data.pop('password')

        if not email or not password:
            raise serializers.ValidationError("Email and password are required to create a user.")

        if User.objects.filter(email=email, tenant=tenant).exists():
            raise serializers.ValidationError("A user with this email already exists in this tenant.")
        
        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password,
                role=validated_data['role'],
                tenant=tenant
            )
            validated_data.pop('tenant', None) # pop tenant as it is not needed ini employee record

            with schema_context(tenant.schema_name):
                with transaction.atomic():
                    employee = Employee.objects.create(
                        user=user,
                        **validated_data,
                        date_joined=timezone.now().date()
                    )

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