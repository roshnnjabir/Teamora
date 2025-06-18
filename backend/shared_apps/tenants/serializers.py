from rest_framework import serializers
from shared_apps.tenants.models import Client, Domain
from shared_apps.custom_auth.models import User
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

        # Step 3: Create Admin user and link directly to tenant
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role='tenant_admin',
            tenant=tenant
        )
        
        user.first_name = validated_data['full_name']
        user.save()

        # Step 4: Send Email with Link
        send_tenant_created_email(to_email=user.email, tenant_domain=domain_url)

        return tenant