"""
Project Manager Assignment Views

Handles assigning developers to project managers,
grouping views, and returning assigned/unassigned developer data.
"""

from collections import defaultdict
import logging

from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from tenant_apps.employee.models import Employee, ProjectManagerAssignment
from tenant_apps.project_management.models import (
    Project,
    ProjectMember,
    Subtask,
)
from tenant_apps.project_management.services import (
    log_pm_assignment_change,
)
from tenant_apps.project_management.serializers import (
    ProjectManagerAssignmentSerializer,
    SimpleEmployeeSerializer
)
from core.permissions import (
    IsTenantAdmin,
    IsProjectManagerOrTenantAdmin
)
from core.constants import (
    TaskStatus,
    UserRoles
)

logger = logging.getLogger(__name__)


class ProjectManagerAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectManagerAssignment.objects.all()
    serializer_class = ProjectManagerAssignmentSerializer
    permission_classes = [IsAuthenticated, IsProjectManagerOrTenantAdmin]

    def create(self, request, *args, **kwargs):
        developer_id = request.data.get("developer")
        manager_id = request.data.get("manager")
        assigned_by = request.user.employee

        if not developer_id:
            return Response({"detail": "Developer ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            developer = Employee.objects.get(id=developer_id)
        except Employee.DoesNotExist:
            return Response({"detail": "Invalid developer ID."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            existing = ProjectManagerAssignment.objects.get(developer=developer)
            previous_manager = existing.manager

            # Fetch all projects managed by the previous manager
            projects_managed = Project.objects.filter(assigned_pm=previous_manager)

            # Check if the developer has active subtasks in those projects
            active_subtasks = Subtask.objects.filter(
                task__project__in=projects_managed,
                assigned_to=developer,
                status__in=[TaskStatus.TODO, TaskStatus.IN_PROGRESS]
            )

            if active_subtasks.exists():
                return Response({
                    "detail": "Developer still has active subtasks in projects managed by the current PM.",
                    "blocking_subtasks": list(active_subtasks.values("id", "title", "task__title", "task__project__name"))
                }, status=status.HTTP_400_BAD_REQUEST)

            if manager_id is None:
                # Unassign: delete the assignment
                existing.delete()

                # Remove developer from all projects managed by the previous manager
                removed_projects = []
                for project in projects_managed:
                    try:
                        pmember = ProjectMember.objects.get(project=project, employee=developer, is_active=True)
                        pmember.is_active = False
                        pmember.save()
                        removed_projects.append(project.id)
                    except ProjectMember.DoesNotExist:
                        continue

                log_pm_assignment_change(developer_id, previous_manager.id, None, assigned_by)

                return Response({
                    "detail": "Developer unassigned and removed from all related projects.",
                    "removed_from_projects": removed_projects
                }, status=status.HTTP_204_NO_CONTENT)

            else:
                # Reassign to new manager
                existing.manager_id = manager_id
                existing.assigned_by = assigned_by
                existing.save()

                log_pm_assignment_change(developer_id, previous_manager.id, manager_id, assigned_by)

                serializer = ProjectManagerAssignmentSerializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

        except ProjectManagerAssignment.DoesNotExist:
            if manager_id is None:
                return Response({"detail": "No assignment to remove."}, status=status.HTTP_400_BAD_REQUEST)

            # Assigning for the first time (new PM)
            assignment = ProjectManagerAssignment.objects.create(
                manager_id=manager_id,
                developer_id=developer_id,
                assigned_by=assigned_by
            )
            log_pm_assignment_change(developer_id, None, manager_id, assigned_by)

            serializer = ProjectManagerAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class GroupedPMAssignmentView(APIView):
    permission_classes = [IsAuthenticated, IsTenantAdmin]

    def get(self, request):
        all_pms = Employee.objects.filter(user__role=UserRoles.PROJECT_MANAGER)
        all_devs = set(Employee.objects.filter(user__role=UserRoles.DEVELOPER))

        assignments = ProjectManagerAssignment.objects.select_related(
            "manager", "developer", "manager__user", "developer__user"
        )

        grouped = defaultdict(list)
        assigned_devs = set()

        for assignment in assignments:
            grouped[assignment.manager.id].append(assignment.developer)
            assigned_devs.add(assignment.developer)

        unassigned_devs = all_devs - assigned_devs

        result = []

        for pm in all_pms:
            devs = grouped.get(pm.id, [])
            result.append({
                "manager": SimpleEmployeeSerializer(pm).data,
                "developers": SimpleEmployeeSerializer(devs, many=True).data
            })

        if unassigned_devs:
            result.append({
                "manager": {
                    "id": 0,
                    "full_name": "Unassigned",
                    "email": "—"
                },
                "developers": SimpleEmployeeSerializer(unassigned_devs, many=True).data
            })


        return Response(result, status=status.HTTP_200_OK)


class ProjectManagerMyDevelopersView(APIView):
    permission_classes = [IsAuthenticated, IsProjectManagerOrTenantAdmin]

    def get(self, request):
        project_id = request.query_params.get('project_id')
        current_pm = request.user.employee

        # All developers assigned to this PM
        assigned_qs = ProjectManagerAssignment.objects.filter(
            manager=current_pm
        ).select_related('developer', 'developer__user')

        if project_id:
            # Only devs who are project members
            developer_ids = assigned_qs.values_list('developer_id', flat=True)

            project_member_qs = ProjectMember.objects.filter(
                project_id=project_id,
                employee_id__in=developer_ids,
                is_active=True
            ).select_related('employee__user')

            developers = [pm.employee for pm in project_member_qs]
        else:
            developers = [a.developer for a in assigned_qs]

        # response with subtask count
        data = []
        for dev in developers:
            if project_id:
                subtask_qs = Subtask.objects.filter(
                    assigned_to=dev,
                    task__project_id=project_id
                )
            else:
                subtask_qs = Subtask.objects.filter(
                    assigned_to=dev,
                    task__project__is_active=True
                )

            subtask_count = subtask_qs.count()
            completed_count = subtask_qs.filter(status='done').count()

            data.append({
                "id": dev.id,
                "full_name": dev.full_name, 
                "email": dev.user.email,
                "assigned_subtasks_count": subtask_count,
                "completed_subtasks_count": completed_count,
                "incomplete_subtasks_count": subtask_count - completed_count,
            })

        return Response(data, status=status.HTTP_200_OK)