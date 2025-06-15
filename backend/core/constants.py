# core/constants.py
from django.db import models

USER_ROLES = {
    'SUPER_ADMIN': 'super_admin',
    'TENANT_ADMIN': 'tenant_admin',
    'PROJECT_MANAGER': 'project_manager',
    'HR': 'hr',
    'DEVELOPER': 'developer'
}

class UserRoles(models.TextChoices):
    SUPER_ADMIN = 'super_admin', 'Super Admin'
    TENANT_ADMIN = 'tenant_admin', 'Tenant Admin'
    PROJECT_MANAGER = 'project_manager', 'Project Manager'
    HR = 'hr', 'HR'
    DEVELOPER = 'developer', 'Developer'

TASK_STATUSES = ['open', 'in_progress', 'closed']