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


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee = getattr(user, 'employee', None)

        if not employee:
            return Comment.objects.none()

        content_type_str = self.request.query_params.get("content_type")
        object_id = self.request.query_params.get("object_id")

        if not content_type_str or not object_id:
            return Comment.objects.none()

        try:
            ct = ContentType.objects.get(model=content_type_str.lower())
        except ContentType.DoesNotExist:
            return Comment.objects.none()

        # Role-sensitive access
        if ct.model == 'task':
            try:
                task = Task.objects.get(id=object_id)
            except Task.DoesNotExist:
                return Comment.objects.none()

            is_member = ProjectMember.objects.filter(
                project=task.project,
                employee=employee,
                is_active=True
            ).exists()

            if not is_member:
                return Comment.objects.none()

        elif ct.model == 'subtask':
            try:
                subtask = Subtask.objects.select_related('task__project').get(id=object_id)
            except Subtask.DoesNotExist:
                return Comment.objects.none()

            project = subtask.task.project

            is_member = ProjectMember.objects.filter(
                project=project,
                employee=employee,
                is_active=True
            ).exists()

            is_assigned = subtask.assigned_to == employee

            if user.role == 'developer' and not is_assigned:
                return Comment.objects.none()
            elif user.role != 'developer' and not is_member:
                return Comment.objects.none()

        else:
            return Comment.objects.none()

        return Comment.objects.filter(
            content_type=ct,
            object_id=object_id
        ).order_by("-created_at")