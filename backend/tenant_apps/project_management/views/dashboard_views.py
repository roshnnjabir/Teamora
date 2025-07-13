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


class DeveloperDashboardDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = request.user.employee

        # Get all projects this employee is part of
        project_memberships = ProjectMember.objects.filter(employee=employee, is_active=True)
        project_ids = project_memberships.values_list("project_id", flat=True)

        # Get all subtasks assigned to this employee
        subtasks = Subtask.objects.filter(assigned_to=employee).select_related("task", "task__project")

        # Group subtasks by project and task
        dashboard_data = {}
        for subtask in subtasks:
            project = subtask.task.project
            task = subtask.task

            if project.id not in dashboard_data:
                dashboard_data[project.id] = {
                    "id": project.id,
                    "name": project.name,
                    "is_active": project.is_active,
                    "tasks": {}
                }

            task_entry = dashboard_data[project.id]["tasks"].setdefault(task.id, {
                "id": task.id,
                "name": task.title,
                "subtasks": []
            })

            task_entry["subtasks"].append({
                "id": subtask.id,
                "title": subtask.title,
                "status": subtask.status,
                "due_date": subtask.due_date
            })

        # Convert dict to list
        result = list(dashboard_data.values())
        for project in result:
            project["tasks"] = list(project["tasks"].values())

        return Response(result)