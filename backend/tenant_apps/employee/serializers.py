from rest_framework import serializers
from shared_apps.custom_auth.models import User
from tenant_apps.employee.models import Employee
from core.constants import UserRoles
from django.utils import timezone

class EmployeeCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField()
    job_title = serializers.CharField()
    role = serializers.ChoiceField(choices=UserRoles.choices)
    department = serializers.CharField()

    def validate_role(self, value):
        if value in [UserRoles.SUPER_ADMIN, UserRoles.TENANT_ADMIN]:
            raise serializers.ValidationError("Cannot assign this role here.")
        return value

    def create(self, validated_data):
        tenant = self.context['request'].tenant

        # Create User in public schema with direct tenant assignment
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role'],
            tenant=tenant
        )

        # Create Employee in tenant schema
        from django_tenants.utils import schema_context
        with schema_context(tenant.schema_name):
            employee = Employee.objects.create(
                user=user,
                full_name=validated_data['full_name'],
                job_title=validated_data['job_title'],
                role=validated_data['role'],
                department=validated_data['department'],
                date_joined=timezone.now().date()
            )

        return employee

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
