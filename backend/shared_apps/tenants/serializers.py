from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.management import call_command
from django_tenants.utils import schema_context
from datetime import date
import re

from shared_apps.tenants.models import Client, Domain
from shared_apps.custom_auth.models import User
from tenant_apps.employee.models import Employee
from core.constants import UserRoles
from shared_apps.tenants.tasks.email_tasks import send_tenant_created_email_task


class TenantSignupSerializer(serializers.Serializer):
    tenant_name = serializers.CharField(max_length=100)
    domain_url = serializers.CharField(max_length=100)  # e.g. tenant1.example.com
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=100)

    def validate_domain_url(self, value):
        if Domain.objects.filter(domain=value).exists():
            raise serializers.ValidationError("Domain already exists.")
        return value

    def validate(self, attrs):
        password = attrs.get('password')

        # Minimum length
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})

        # At least one uppercase letter
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter."})

        # At least one lowercase letter
        if not re.search(r'[a-z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one lowercase letter."})

        # At least one digit
        if not re.search(r'\d', password):
            raise serializers.ValidationError({"password": "Password must contain at least one number."})

        # At least one special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one special character."})

        return attrs

    def create(self, validated_data):
        # Step 1: Create Tenant
        schema_name = validated_data['domain_url'].split('.')[0]

        tenant = Client.objects.create(
            name=validated_data['tenant_name'],
            schema_name=schema_name,
            paid_until=None,
            on_trial=True
        )

        # Step 2: Create Domain
        domain_url = validated_data['domain_url']
        Domain.objects.create(
            domain=domain_url,
            tenant=tenant,
            is_primary=True
        )

        # Step 3: Run migrations inside the tenant's schema 
        call_command('migrate_schemas', schema_name=schema_name, interactive=False, verbosity=0)

        # Step 4: Create Admin user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=UserRoles.TENANT_ADMIN,
            tenant=tenant
        )
        user.first_name = validated_data['full_name']
        user.save()

        # Step 5: Create Employee record inside tenant schema
        with schema_context(schema_name):
            Employee.objects.create(
                user=user,
                full_name=validated_data['full_name'],
                job_title="Tenant Admin",
                department="Management",
                date_joined=date.today()
            )

        # Step 6: Send email
        send_tenant_created_email_task.delay(to_email=user.email, tenant_domain=domain_url)

        return tenant