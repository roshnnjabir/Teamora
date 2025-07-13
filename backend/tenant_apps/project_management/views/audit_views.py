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


class DeveloperAssignmentAuditLogPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 50


class DeveloperAuditLogFilter(django_filters.FilterSet):
    from_date = django_filters.DateFilter(field_name="assigned_at", lookup_expr="gte")
    to_date = django_filters.DateFilter(field_name="assigned_at", lookup_expr="lte")

    class Meta:
        model = DeveloperAssignmentAuditLog
        fields = ['developer', 'assigned_by', 'previous_manager', 'new_manager']


class DeveloperAssignmentAuditLogList(generics.ListAPIView):
    http_method_names = ['get']

    queryset = DeveloperAssignmentAuditLog.objects.select_related(
        'developer', 'previous_manager', 'new_manager', 'assigned_by'
    ).order_by('-assigned_at').distinct()

    serializer_class = DeveloperAssignmentAuditLogSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    pagination_class = DeveloperAssignmentAuditLogPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DeveloperAuditLogFilter
    filterset_fields = ['developer', 'previous_manager', 'new_manager', 'assigned_by']
    search_fields = ['developer__full_name', 'assigned_by__full_name']