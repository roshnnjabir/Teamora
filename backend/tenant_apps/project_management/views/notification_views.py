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

class NotifyPMView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        developer_id = request.data.get("developer_id")
        subtask_ids = request.data.get("subtask_ids", [])

        if not developer_id or not subtask_ids:
            return Response({"detail": "Developer ID and subtask IDs are required."}, status=400)

        try:
            developer = Employee.objects.get(id=developer_id)
        except ObjectDoesNotExist:
            return Response({"detail": "Invalid developer ID."}, status=400)

        subtasks = Subtask.objects.filter(id__in=subtask_ids, assigned_to=developer).select_related(
            "task__project"
        )
        if not subtasks.exists():
            return Response({"detail": "No matching subtasks found."}, status=404)

        pm_to_subtasks = {}
        for subtask in subtasks:
            pm = subtask.task.project.assigned_pm
            if pm:
                pm_to_subtasks.setdefault(pm, []).append(subtask)

        for pm, subtasks_list in pm_to_subtasks.items():
            project_names = {s.task.project.name for s in subtasks_list}
            message = (
                f"Developer {developer.full_name} has active subtasks in your projects: "
                + ", ".join(project_names)
                + ". Please resolve them to allow unassignment."
            )
            Notification.objects.create(
                recipient=pm,
                message=message,
                url="/pm/my-subtasks/"
            )

            send_pm_blocking_subtasks_email.delay(pm.id, developer.full_name, list(project_names))

        return Response({"detail": "PM(s) notified successfully."})