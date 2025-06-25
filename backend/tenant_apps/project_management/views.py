from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from collections import defaultdict
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from tenant_apps.employee.models import ProjectManagerAssignment
from tenant_apps.project_management.models import AssignmentAuditLog
from core.permissions import (
    IsTenantAdmin,
    IsProjectManagerOrTenantAdmin,
    IsProjectReadOnlyOrManager,
)
from rest_framework.permissions import IsAuthenticated
from .models import Project, ProjectMember, Task, Subtask
from .serializers import (
    ProjectSerializer,
    ProjectMemberSerializer,
    TaskSerializer,
    SubtaskSerializer,
    ProjectManagerAssignmentSerializer,
    SimpleEmployeeSerializer,
    AssignmentAuditLogSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectReadOnlyOrManager]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user.employee)

    def get_queryset(self):
        user = self.request.user
        if user.is_tenant_admin():
            return Project.objects.all()
        return Project.objects.filter(members=user.employee)


class ProjectManagerAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectManagerAssignment.objects.all()
    serializer_class = ProjectManagerAssignmentSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]

    def create(self, request, *args, **kwargs):
        developer_id = request.data.get("developer")
        manager_id = request.data.get("manager")
        assigned_by = request.user.employee

        if not developer_id or not manager_id:
            return Response({"detail": "Manager and Developer IDs are required."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            existing = ProjectManagerAssignment.objects.get(developer_id=developer_id)
            previous_manager = existing.manager

            # Update assignment
            existing.manager_id = manager_id
            existing.assigned_by = assigned_by
            existing.save()

            # Create audit log for reassignment
            AssignmentAuditLog.objects.create(
                developer_id=developer_id,
                previous_manager=previous_manager,
                new_manager_id=manager_id,
                assigned_by=assigned_by
            )

            serializer = ProjectManagerAssignmentSerializer(existing)
            return Response(serializer.data)

        except ProjectManagerAssignment.DoesNotExist:
            # Create new assignment
            assignment = ProjectManagerAssignment.objects.create(
                manager_id=manager_id,
                developer_id=developer_id,
                assigned_by=assigned_by
            )

            # Log new assignment
            AssignmentAuditLog.objects.create(
                developer_id=developer_id,
                previous_manager=None,
                new_manager_id=manager_id,
                assigned_by=assigned_by
            )

            serializer = ProjectManagerAssignmentSerializer(assignment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class AssignmentAuditLogList(generics.ListAPIView):
    queryset = AssignmentAuditLog.objects.all().select_related('developer', 'previous_manager', 'new_manager', 'assigned_by')
    serializer_class = AssignmentAuditLogSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]


class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin | IsProjectManagerOrTenantAdmin]

    def get_queryset(self):
        return ProjectMember.objects.all()

    def perform_create(self, serializer):
        pm = self.request.user.employee
        employee = serializer.validated_data['employee']
    
        if self.request.user.role == UserRoles.PROJECT_MANAGER:
            if not ProjectManagerAssignment.objects.filter(manager=pm, developer=employee).exists():
                raise PermissionDenied("You can only assign developers who are under your management.")
    
        serializer.save()


class GroupedPMAssignmentView(APIView):
    permission_classes = [IsAuthenticated, IsTenantAdmin]

    def get(self, request):
        assignments = ProjectManagerAssignment.objects.select_related(
            "manager", "developer", "manager__user", "developer__user"
        )

        grouped = defaultdict(list)

        for assignment in assignments:
            grouped[assignment.manager].append(assignment.developer)

        result = [
            {
                "manager": SimpleEmployeeSerializer(manager).data,
                "developers": SimpleEmployeeSerializer(developers, many=True).data
            }
            for manager, developers in grouped.items()
        ]

        return Response(result)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsProjectManagerOrTenantAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_tenant_admin():
            return Task.objects.all()
        return Task.objects.filter(project__members=user.employee)

    def perform_create(self, serializer):
        user = self.request.user
        task = serializer.save()

        if user.role == UserRoles.PROJECT_MANAGER:
            if not ProjectMember.objects.filter(project=task.project, employee=user.employee).exists():
                raise PermissionDenied("You're not a member of this project.")

            if not ProjectMember.objects.filter(project=task.project, employee=task.assigned_to).exists():
                raise PermissionDenied("Assigned user is not in this project.")


class SubtaskViewSet(viewsets.ModelViewSet):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated, IsProjectManagerOrTenantAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_tenant_admin():
            return Subtask.objects.all()
        return Subtask.objects.filter(task__assigned_to=user.employee)