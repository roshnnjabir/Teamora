"""
Comment Views

Handles comment creation, listing, and modification for tasks and subtasks.
"""

import logging

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from core.utils.comment_access import is_employee_allowed_to_comment
from core.constants import UserRoles

from tenant_apps.project_management.models import Comment, Task, Subtask, ProjectMember
from tenant_apps.project_management.serializers import CommentSerializer

logger = logging.getLogger(__name__)


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

        content_type = ContentType.objects.filter(model=content_type_str.lower()).first()
        if not content_type:
            return Comment.objects.none()

        if not is_employee_allowed_to_comment(user, content_type, object_id):
            return Comment.objects.none()

        return Comment.objects.filter(
            content_type=content_type,
            object_id=object_id
        ).order_by("-created_at")