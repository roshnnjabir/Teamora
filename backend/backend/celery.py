# backend/celery.py

import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings.local")

celery_app = Celery("backend")
celery_app.config_from_object("django.conf:settings", namespace="CELERY")

celery_app.autodiscover_tasks([
    'shared_apps.custom_auth.tasks.email_tasks',
    'shared_apps.tenants.tasks.email_tasks',
    'tenant_apps.employee.tasks.email_tasks',
    'tenant_apps.project_management.tasks.email_tasks',
])