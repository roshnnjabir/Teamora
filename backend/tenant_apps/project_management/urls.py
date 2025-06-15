from django.urls import path
from tenant_apps.project_management import views

urlpatterns = [
    path('project_management', views.ProjectOnlyView.as_view(), name='project_management'),
]