"""
Task & Subtask Views

This module includes viewsets for managing tasks, subtasks, and task-related metadata like labels.
"""

import logging
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from tenant_apps.employee.models import Employee, Notification
from tenant_apps.project_management.models import (
    Project, Task, Subtask,
    SubtaskAssignmentAudit, Label,
    ProjectMember
)
from tenant_apps.project_management.tasks.email_tasks import send_pm_blocking_subtasks_email

from core.constants import UserRoles
from core.guards.project_guards import (
    ensure_project_is_active,
    ensure_active_via_task,
    ensure_active_via_subtask,
)
from core.permissions import (
    IsProjectReadOnlyOrManager,
    IsProjectManagerOrTenantAdmin,
)

from tenant_apps.project_management.serializers import (
    TaskSerializer,
    SubtaskSerializer,
    LabelSerializer,
    SubtaskAssignmentAuditSerializer,
)

logger = logging.getLogger(__name__)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsProjectReadOnlyOrManager]

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.all() if user.is_tenant_admin() else Task.objects.filter(project__project_members__employee=user.employee)

        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user.employee)
        ensure_project_is_active(obj.project)

        user = self.request.user
        employee = user.employee
        task = serializer.save(created_by=employee)

        if employee.user.role == UserRoles.PROJECT_MANAGER:
            if not ProjectMember.objects.filter(is_active=True, project=task.project, employee=employee).exists():
                raise PermissionDenied("You're not a member of this project.")

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        ensure_project_is_active(instance.project)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        ensure_active_via_task(task)
        return super().destroy(request, *args, **kwargs)


class SubtaskViewSet(viewsets.ModelViewSet):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        employee = getattr(user, 'employee', None)

        if user.is_tenant_admin():
            return Subtask.objects.all()

        if user.role == UserRoles.PROJECT_MANAGER:
            return Subtask.objects.filter(
                task__project__project_members__employee=employee,
                task__project__project_members__role=UserRoles.PROJECT_MANAGER,
            ).distinct()

        if user.role == UserRoles.DEVELOPER:
            return Subtask.objects.filter(assigned_to=employee)

        return Subtask.objects.none()

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        employee = user.employee
        
        logger.warning(f"PM membership check: {user.role}")

        if user.is_tenant_admin():
            logger.debug(f"Tenant Admin: {user.is_tenant_admin()}")
            return obj

        if user.role == UserRoles.PROJECT_MANAGER:
            logger.warning(employee)
            logger.warning(obj.task.project)
            logger.warning(UserRoles.PROJECT_MANAGER == user.role)
            is_pm = ProjectMember.objects.filter(
                employee=employee,
                project=obj.task.project,
                role=UserRoles.PROJECT_MANAGER,
                is_active=True
            ).exists()
            logger.debug(f"PM membership check: {is_pm}")
            if is_pm:
                return obj

        if user.role == UserRoles.DEVELOPER and obj.assigned_to == employee:
            return obj

        logger.warning(f"Access denied for user {user} on subtask {obj.id}")
        raise PermissionDenied("You do not have permission to access this subtask.")

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        ensure_project_is_active(instance.task.project)

        subtask = self.get_object()
        user = request.user
        employee = user.employee
        previous_assignee = subtask.assigned_to
    
        # Developer permission restriction
        if user.role == UserRoles.DEVELOPER:
            if subtask.assigned_to != employee:
                raise PermissionDenied("You can only update subtasks assigned to you.")
    
            allowed_fields = {'status', 'due_date'}
            if not all(field in allowed_fields for field in request.data.keys()):
                raise PermissionDenied("You can only update status or due date.")
    
        # Perform update
        response = super().partial_update(request, *args, **kwargs)
    
        # Log reassignment only if 'assigned_to' changed
        new_assignee_id = request.data.get('assigned_to')
        if 'assigned_to' in request.data:
            new_assignee = None
            if new_assignee_id:
                try:
                    new_assignee = Employee.objects.get(id=new_assignee_id)
                except Employee.DoesNotExist:
                    pass
    
            if previous_assignee != new_assignee:
                SubtaskAssignmentAudit.objects.create(
                    subtask=subtask,
                    previous_assignee=previous_assignee,
                    new_assignee=new_assignee,
                    changed_by=request.user
                )
    
        return response

    def destroy(self, request, *args, **kwargs):
        subtask = self.get_object()
        ensure_active_via_subtask(subtask)
        return super().destroy(request, *args, **kwargs)


class LabelViewSet(viewsets.ModelViewSet):
    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    permission_classes = [IsAuthenticated, IsProjectManagerOrTenantAdmin]

    def get_queryset(self):
        user = self.request.user
        employee = getattr(user, "employee", None)

        if not employee:
            return Label.objects.none()

        if user.role == UserRoles.DEVELOPER:
            task_label_ids = Label.objects.filter(tasks__project__project_members__employee=employee).values_list("id", flat=True)
            subtask_label_ids = Label.objects.filter(subtasks__assigned_to=employee).values_list("id", flat=True)

            label_ids = set(task_label_ids).union(set(subtask_label_ids))
            return Label.objects.filter(id__in=label_ids).distinct()

        return Label.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user.employee)