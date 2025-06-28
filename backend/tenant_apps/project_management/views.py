from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from collections import defaultdict
from rest_framework import generics, status
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.exceptions import PermissionDenied
from tenant_apps.employee.models import Employee, ProjectManagerAssignment
from tenant_apps.project_management.models import DeveloperAssignmentAuditLog
from core.constants import UserRoles
from core.permissions import (
    IsTenantAdmin,
    IsProjectManagerOrTenantAdmin,
    IsProjectReadOnlyOrManager,
    IsAssigneeOrManager
)
from rest_framework.permissions import IsAuthenticated
from .models import Project, ProjectMember, Task, Subtask, TaskAssignmentAudit
from .serializers import (
    ProjectSerializer,
    ProjectMemberSerializer,
    TaskSerializer,
    SubtaskSerializer,
    ProjectManagerAssignmentSerializer,
    SimpleEmployeeSerializer,
    DeveloperAssignmentAuditLogSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectReadOnlyOrManager]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user.employee)

    def get_queryset(self):
        user = self.request.user
        base_qs = Project.objects.all() if user.is_tenant_admin() else Project.objects.filter(members=user.employee)

        return base_qs.filter(is_active=True).prefetch_related('members')


class ProjectManagerAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectManagerAssignment.objects.all()
    serializer_class = ProjectManagerAssignmentSerializer
    permission_classes = [IsAuthenticated, IsProjectManagerOrTenantAdmin]

    def create(self, request, *args, **kwargs):
        developer_id = request.data.get("developer")
        manager_id = request.data.get("manager")
        assigned_by = request.user.employee

        if not developer_id:
            return Response({"detail": "Developer ID is required."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            developer = Employee.objects.get(id=developer_id)
        except Employee.DoesNotExist:
            return Response({"detail": "Invalid developer ID."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            existing = ProjectManagerAssignment.objects.get(developer=developer)
            previous_manager = existing.manager

            if manager_id is None:
                # Unassign: delete the assignment
                existing.delete()

                DeveloperAssignmentAuditLog.objects.create(
                    developer_id=developer_id,
                    previous_manager=previous_manager,
                    new_manager=None,
                    assigned_by=assigned_by
                )

                return Response({"detail": "Developer unassigned."}, status=status.HTTP_204_NO_CONTENT)

            else:
                # Update assignment
                existing.manager_id = manager_id
                existing.assigned_by = assigned_by
                existing.save()

                # Create audit log for reassignment
                DeveloperAssignmentAuditLog.objects.create(
                    developer_id=developer_id,
                    previous_manager=previous_manager,
                    new_manager_id=manager_id,
                    assigned_by=assigned_by
                )

                serializer = ProjectManagerAssignmentSerializer(existing)
                return Response(serializer.data)

        except ProjectManagerAssignment.DoesNotExist:
            if manager_id is None:
                return Response({"detail": "No assignment to remove."}, status=status.HTTP_400_BAD_REQUEST)


            # Create new assignment
            assignment = ProjectManagerAssignment.objects.create(
                manager_id=manager_id,
                developer_id=developer_id,
                assigned_by=assigned_by
            )

            # Log new assignment
            DeveloperAssignmentAuditLog.objects.create(
                developer_id=developer_id,
                previous_manager=None,
                new_manager_id=manager_id,
                assigned_by=assigned_by
            )

            serializer = ProjectManagerAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class DeveloperAssignmentAuditLogPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 50


class DeveloperAssignmentAuditLogList(generics.ListAPIView):
    queryset = DeveloperAssignmentAuditLog.objects.all().select_related('developer', 'previous_manager', 'new_manager', 'assigned_by').order_by('-assigned_at')
    serializer_class = DeveloperAssignmentAuditLogSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    pagination_class = DeveloperAssignmentAuditLogPagination


class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.filter(is_active=True)
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin | IsProjectManagerOrTenantAdmin]

    def get_queryset(self):
        return ProjectMember.objects.filter(is_active=True)

    def perform_create(self, serializer):
        pm = self.request.user.employee
        employee = serializer.validated_data['employee']

        if self.request.user.role == UserRoles.PROJECT_MANAGER:
            if not ProjectManagerAssignment.objects.filter(manager=pm, developer=employee).exists():
                raise PermissionDenied("You can only assign developers who are under your management.")

        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.role == "Project Manager":
            raise PermissionDenied("You cannot delete a Project Manager from the project.")

        from tenant_apps.project_management.models import Task

        Task.objects.filter(
            project=instance.project,
            assigned_to=instance.employee
        ).update(assigned_to=None)

        instance.is_active = False
        instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        project_id = request.data.get("project")
        developer_ids = request.data.get("developers", [])

        if not project_id or not isinstance(developer_ids, list):
            return Response({"detail": "Project ID and developer list required."}, status=400)

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found."}, status=404)

        pm = request.user.employee

        developers = Employee.objects.filter(id__in=developer_ids)
        if request.user.role == UserRoles.PROJECT_MANAGER:
            developers = developers.filter(
                id__in=ProjectManagerAssignment.objects.filter(manager=pm).values_list("developer_id", flat=True)
            )

        valid_dev_ids = set(developers.values_list("id", flat=True))
        created_memberships = []

        for dev_id in valid_dev_ids:
            member, created = ProjectMember.objects.get_or_create(
                project=project,
                employee_id=dev_id,
                defaults={"role": "Developer", "is_active": True}
            )
            if not created and not member.is_active:
                member.is_active = True
                member.save()
                created_memberships.append(member.id)
            elif created:
                created_memberships.append(member.id)

        return Response({
            "detail": f"{len(created_memberships)} new member(s) added or reactivated.",
            "created_ids": created_memberships,
        })


class GroupedPMAssignmentView(APIView):
    permission_classes = [IsAuthenticated, IsTenantAdmin]

    def get(self, request):
        all_pms = Employee.objects.filter(role='project_manager')
        all_devs = set(Employee.objects.filter(role='developer'))

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


        return Response(result)


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
            # If project filter is present, only return devs who are also project members
            developer_ids = assigned_qs.values_list('developer_id', flat=True)

            project_member_qs = ProjectMember.objects.filter(
                project_id=project_id,
                employee_id__in=developer_ids,
                is_active=True
            ).select_related('employee__user')

            developers = [pm.employee for pm in project_member_qs]
        else:
            # Return all devs under the PM
            developers = [a.developer for a in assigned_qs]

        return Response(SimpleEmployeeSerializer(developers, many=True).data)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsAssigneeOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.is_tenant_admin():
            return Task.objects.all()
        return Task.objects.filter(project__members=user.employee)

    def perform_create(self, serializer):
        user = self.request.user
        employee = user.employee
        task = serializer.save(created_by=employee)

        if employee.role == UserRoles.PROJECT_MANAGER:
            if not ProjectMember.objects.filter(is_active=True, project=task.project, employee=employee).exists():
                raise PermissionDenied("You're not a member of this project.")

            if task.assigned_to and not ProjectMember.objects.filter(is_active=True, project=task.project, employee=task.assigned_to).exists():
                raise PermissionDenied("Assigned user is not in this project.")

    def partial_update(self, request, *args, **kwargs):
        task = self.get_object()
        user = request.user
        employee = user.employee
        previous_assignee = task.assigned_to
    
        # Developer-specific permission check
        if user.role == UserRoles.DEVELOPER:
            if task.assigned_to != employee:
                raise PermissionDenied("You can only update tasks assigned to you.")
    
            # Restrict what fields a developer can update
            allowed_fields = {'status', 'due_date'}
            if not all(field in allowed_fields for field in request.data.keys()):
                raise PermissionDenied("You can only update status or due date.")
    
        # Call super to handle the update
        response = super().partial_update(request, *args, **kwargs)
    
        # Audit log if reassignment happened
        new_assignee_id = request.data.get('assigned_to')
        if 'assigned_to' in request.data:
            new_assignee = None
            if new_assignee_id:
                try:
                    new_assignee = Employee.objects.get(id=new_assignee_id)
                except Employee.DoesNotExist:
                    pass
    
            if previous_assignee != new_assignee:
                from tenant_apps.project_management.models import TaskAssignmentAudit
                TaskAssignmentAudit.objects.create(
                    task=task,
                    previous_assignee=previous_assignee,
                    new_assignee=new_assignee,
                    changed_by=user,
                )
    
        return response


class SubtaskViewSet(viewsets.ModelViewSet):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated, IsProjectManagerOrTenantAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_tenant_admin():
            return Subtask.objects.all()
        return Subtask.objects.filter(task__assigned_to=user.employee)


class MyAssignedTasksList(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(assigned_to=self.request.user.employee)