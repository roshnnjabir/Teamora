"""
Developer Assignment Audit Views

Manages listing and filtering audit logs that track developer–manager assignment history.
"""

import django_filters
import logging

from rest_framework import generics, filters
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from tenant_apps.project_management.models import DeveloperAssignmentAuditLog
from core.permissions import IsTenantAdmin
from .serializers import DeveloperAssignmentAuditLogSerializer

logger = logging.getLogger(__name__)


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