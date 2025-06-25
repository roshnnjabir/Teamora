# shared/custom_auth/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models
from core.constants import UserRoles
from django.contrib.auth.models import AbstractUser, Group, Permission
from shared_apps.custom_auth.managers import CustomUserManager

class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    role = models.CharField(max_length=30, choices=UserRoles.choices)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    tenant = models.ForeignKey('tenants.Client', on_delete=models.CASCADE, related_name='users', null=True, blank=True)

    objects = CustomUserManager()

    def clean(self):
        if self.role == UserRoles.SUPER_ADMIN and self.tenant is not None:
            raise ValidationError("Super admins must not be assigned to a tenant.")
        elif self.role != UserRoles.SUPER_ADMIN and self.tenant is None:
            raise ValidationError("Non-super admins must be assigned to a tenant.")
    
    def is_super_admin(self):
        return self.role == UserRoles.SUPER_ADMIN and self.tenant is None

    def is_tenant_admin(self):
        return self.role == UserRoles.TENANT_ADMIN and self.tenant is not None

    def get_tenant_roles(self):
        return {
            "is_pm": self.role == UserRoles.PROJECT_MANAGER,
            "is_hr": self.role == UserRoles.HR,
            "is_dev": self.role == UserRoles.DEVELOPER,
        }

    def __str__(self):
        return f"{self.email} ({self.role})"
