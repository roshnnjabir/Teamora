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

class ProjectStatus(models.TextChoices):
    PLANNING = 'planning', 'Planning'
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    ON_HOLD = 'on_hold', 'On Hold'

class TaskStatus(models.TextChoices):
    TODO = 'todo', 'To Do'
    IN_PROGRESS = 'in_progress', 'In Progress'
    DONE = 'done', 'Done'

class Priority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'