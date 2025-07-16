"""
Project Member Views

Manages adding, removing, and updating project members.
Includes bulk assignment and validation logic for membership rules.
"""

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tenant_apps.employee.models import Employee, ProjectManagerAssignment
from tenant_apps.project_management.models import Project, ProjectMember, Subtask
from core.constants import UserRoles, TaskStatus
from core.guards.project_guards import (
    ensure_project_is_active,
    ensure_active_via_member
)
from core.permissions import IsTenantAdmin, IsProjectManagerOrTenantAdmin, IsTenantAdminWithAssignOnce
from tenant_apps.project_management.serializers import ProjectMemberSerializer


class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.filter(is_active=True)
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated, IsProjectManagerOrTenantAdmin, IsTenantAdminWithAssignOnce]

    def get_queryset(self):
        return ProjectMember.objects.filter(is_active=True)

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user.employee)
        ensure_project_is_active(obj.project)

        pm = self.request.user.employee
        employee = serializer.validated_data['employee']

        if self.request.user.role == UserRoles.PROJECT_MANAGER:
            if not ProjectManagerAssignment.objects.filter(manager=pm, developer=employee).exists():
                raise PermissionDenied("You can only assign developers who are under your management.")

        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        ensure_active_via_member(instance)

        if request.user.role == UserRoles.PROJECT_MANAGER:
            pm = request.user.employee
            if not ProjectManagerAssignment.objects.filter(manager=pm, developer=instance.employee).exists():
                raise PermissionDenied("You can only remove developers who are under your management.")
    
        if instance.role == UserRoles.PROJECT_MANAGER:
            raise PermissionDenied("You cannot remove a Project Manager from the project.")
    
        # Check if this developer still has subtasks in this project
        active_subtasks = Subtask.objects.filter(
            task__project=instance.project,
            assigned_to=instance.employee,
            status__in=[TaskStatus.TODO, TaskStatus.IN_PROGRESS]
        )
    
        if active_subtasks.exists():
            return Response(
                {"detail": "This developer still has active subtasks assigned. Reassign or remove them first."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
        # Mark as past member (soft delete)
        instance.is_active = False
        instance.save()
    
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        project_id = request.data.get("project")
        developer_ids = request.data.get("developers", [])

        if not project_id or not isinstance(developer_ids, list):
            return Response({"detail": "Project ID and developer list are required."}, status=400)

        project = get_object_or_404(Project, id=project_id)
        pm = request.user.employee

        developers = Employee.objects.filter(id__in=developer_ids)

        # Restrict to PM's developers if user is a Project Manager
        if request.user.role == UserRoles.PROJECT_MANAGER:
            allowed_ids = ProjectManagerAssignment.objects.filter(
                manager=pm
            ).values_list("developer_id", flat=True)
            developers = developers.filter(id__in=allowed_ids)

        valid_dev_ids = set(developers.values_list("id", flat=True))

        newly_created = []
        reactivated = []
        already_active = []

        for dev_id in valid_dev_ids:
            member, created = ProjectMember.objects.get_or_create(
                project=project,
                employee_id=dev_id,
                defaults={"role": UserRoles.DEVELOPER, "is_active": True}
            )

            if created:
                newly_created.append(dev_id)
            elif not member.is_active:
                member.is_active = True
                member.save()
                reactivated.append(dev_id)
            else:
                already_active.append(dev_id)

        return Response({
            "detail": "Bulk assignment completed.",
            "newly_created": newly_created,
            "reactivated": reactivated,
            "already_active": already_active,
            "total_processed": len(newly_created) + len(reactivated) + len(already_active),
        }, status=status.HTTP_200_OK)