from rest_framework import viewsets, generics, status, filters, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from collections import defaultdict
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from django.contrib.contenttypes.models import ContentType
import logging
logger = logging.getLogger(__name__)
from django.shortcuts import get_object_or_404
from tenant_apps.employee.models import Employee, ProjectManagerAssignment, Notification
from tenant_apps.project_management.models import Project, ProjectMember, Task, Subtask, DeveloperAssignmentAuditLog, SubtaskAssignmentAudit, Label, Comment
from tenant_apps.project_management.tasks.email_tasks import send_pm_blocking_subtasks_email
from django.core.exceptions import ObjectDoesNotExist


from core.constants import UserRoles, TaskStatus
from core.guards.project_guards import (
    ensure_project_is_active,
    ensure_active_via_member,
    ensure_active_via_task,
    ensure_active_via_subtask
)
from core.permissions import (
    IsTenantAdmin,
    IsProjectManagerOrTenantAdmin,
    IsProjectReadOnlyOrManager,
    IsAssigneeOrManager
)
from rest_framework.permissions import IsAuthenticated
from .serializers import (
    ProjectSerializer,
    ProjectMemberSerializer,
    TaskSerializer,
    SubtaskSerializer,
    ProjectManagerAssignmentSerializer,
    SimpleEmployeeSerializer,
    DeveloperAssignmentAuditLogSerializer,
    LabelSerializer,
    CommentSerializer,
    SubtaskAssignmentAuditSerializer,
)

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