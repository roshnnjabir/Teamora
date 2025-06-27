from rest_framework import serializers
from shared_apps.tenants.models import Client, Domain
from shared_apps.custom_auth.models import User
from django.core.management import call_command
from django_tenants.utils import schema_context
from tenant_apps.employee.models import Employee
from datetime import date
from core.constants import UserRoles
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from shared_apps.tenants.utils.email import send_tenant_created_email


class TenantSignupSerializer(serializers.Serializer):
    tenant_name = serializers.CharField(max_length=100)
    domain_url = serializers.CharField(max_length=100)  # e.g. tenant1.example.com
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(max_length=100)

    def validate_domain_url(self, value):
        if Domain.objects.filter(domain=value).exists():
            raise serializers.ValidationError("Domain already exists.")
        return value

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
            role='tenant_admin',
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
                role="tenant_admin",
                department="Management",
                date_joined=date.today()
            )

        # Step 6: Send email
        send_tenant_created_email(to_email=user.email, tenant_domain=domain_url)

        return tenant