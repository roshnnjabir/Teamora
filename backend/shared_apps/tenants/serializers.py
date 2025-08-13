from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from django.core.management import call_command
from django_tenants.utils import schema_context
from datetime import date
import re
from backend.settings.base import RESERVED_SUBDOMAINS

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

    def validate_tenant_name(self, value):
        """
        Validate that tenant name is not empty, does not contain spaces, digits, special characters,
        and is not a reserved subdomain.
        """
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Tenant name cannot be empty.")
        
        if value.lower() in RESERVED_SUBDOMAINS:
            raise serializers.ValidationError(f"Tenant name cannot be one of the reserved names: {', '.join(RESERVED_SUBDOMAINS)}.")
        
        if any(char.isdigit() for char in value):
            raise serializers.ValidationError("Tenant name cannot contain numbers.")
        
        # Only allow letters and hyphens, no special characters like '_', '$', etc.
        if not re.match(r'^[a-zA-Z-\s]+$', value):
            raise serializers.ValidationError("Tenant name can only contain letters and hyphens (-).")
        
        if value.startswith('-') or value.endswith('-'):
            raise serializers.ValidationError("Tenant name cannot start or end with a hyphen.")

        return value

    def validate_domain_url(self, value):
        """
        Validate that the domain URL is not empty, is a valid domain format, and does not already exist.
        """
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Domain URL cannot be empty.")
        
        domain_regex = r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,}$"
        if not re.match(domain_regex, value):
            raise serializers.ValidationError("Invalid domain format.")
        
        if Domain.objects.filter(domain=value).exists():
            raise serializers.ValidationError("Domain already exists.")
        
        return value

    def validate_email(self, value):
        """
        Ensure email is not empty.
        """
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Email cannot be empty.")
        return value

    def validate_password(self, value):
        """
        Validate password strength using Django's built-in validators.
        """
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Password cannot be empty.")

        try:
            # Using Django's built-in password validation
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        
        return value

    def validate_full_name(self, value):
        """
        Validate that the full name is not empty.
        """
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Full name cannot be empty.")
        return value

    def validate(self, attrs):
        """
        Validate all fields before creating the tenant.
        """
        # Ensure that none of the required fields are empty
        tenant_name = attrs.get('tenant_name')
        domain_url = attrs.get('domain_url')
        email = attrs.get('email')
        full_name = attrs.get('full_name')

        if not tenant_name.strip():
            raise serializers.ValidationError({"tenant_name": "Tenant name is required."})
        
        if not domain_url.strip():
            raise serializers.ValidationError({"domain_url": "Domain URL is required."})
        
        if not email.strip():
            raise serializers.ValidationError({"email": "Email is required."})
        
        if not full_name.strip():
            raise serializers.ValidationError({"full_name": "Full name is required."})

        # Perform additional validation on the password field
        password = attrs.get('password')
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})

        # Check for complexity requirements
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter."})

        if not re.search(r'[a-z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one lowercase letter."})

        if not re.search(r'\d', password):
            raise serializers.ValidationError({"password": "Password must contain at least one number."})

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one special character."})

        return attrs

    def create(self, validated_data):
        """
        Create the tenant, domain, user, and employee records.
        """
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