import logging

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from tenant_apps.project_management.models import Comment, Task, Subtask, ProjectMember
from .serializers import CommentSerializer

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