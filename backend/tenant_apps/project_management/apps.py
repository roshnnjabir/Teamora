from django.apps import AppConfig


class ProjectManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tenant_apps.project_management'

    def ready(self):
        import tenant_apps.project_management.signals