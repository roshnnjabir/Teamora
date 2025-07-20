"""
Project Views

This module contains viewsets related to project CRUD operations and related actions.
- ProjectViewSet: Handles listing, creating, updating, and retrieving projects.
"""

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tenant_apps.project_management.models import Project, Task
from core.permissions import IsProjectReadOnlyOrManager
from core.constants import UserRoles
from tenant_apps.project_management.serializers import ProjectSerializer, TaskSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectReadOnlyOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRoles.TENANT_ADMIN:
            return Project.objects.all()
        if user.role == UserRoles.PROJECT_MANAGER:
            return Project.objects.filter(assigned_pm=user.employee)
        return Project.objects.none()
    
    @action(detail=True, methods=["get"])
    def tasks(self, request, pk=None):
        project = self.get_object()
        tasks = Task.objects.filter(project=project)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)