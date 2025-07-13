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
from tenant_apps.project_management.serializers import ProjectSerializer, TaskSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectReadOnlyOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.is_tenant_admin:
            return Project.objects.all()
        if user.is_project_manager:
            return Project.objects.filter(assigned_pm=user)
        return Project.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_tenant_admin:
            serializer.save(created_by=user)
        elif user.is_project_manager:
            serializer.save(created_by=user, assigned_pm=user)
    
    @action(detail=True, methods=["get"])
    def tasks(self, request, pk=None):
        project = self.get_object()
        tasks = Task.objects.filter(project=project)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)