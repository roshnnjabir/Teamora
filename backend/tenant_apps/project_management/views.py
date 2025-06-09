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
from core.decorators import ensure_project_is_active, ensure_active_via_member
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


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsProjectReadOnlyOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.is_tenant_admin:
            return Project.objects.all()
        if user.is_project_manager:
            return Project.objects.filter(assigned_pm=user)
        return Project.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_tenant_admin:
            serializer.save(created_by=user)
        elif user.is_project_manager:
            serializer.save(created_by=user, assigned_pm=user)
    
    @action(detail=True, methods=["get"])
    def tasks(self, request, pk=None):
        project = self.get_object()
        tasks = Task.objects.filter(project=project)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)


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

                # Log audit
                DeveloperAssignmentAuditLog.objects.create(
                    developer_id=developer_id,
                    previous_manager=previous_manager,
                    new_manager=None,
                    assigned_by=assigned_by
                )

                return Response({
                    "detail": "Developer unassigned and removed from all related projects.",
                    "removed_from_projects": removed_projects
                }, status=status.HTTP_204_NO_CONTENT)

            else:
                # Reassign to new manager
                existing.manager_id = manager_id
                existing.assigned_by = assigned_by
                existing.save()

                # Audit log
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

            # Assigning for the first time (new PM)
            assignment = ProjectManagerAssignment.objects.create(
                manager_id=manager_id,
                developer_id=developer_id,
                assigned_by=assigned_by
            )

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

class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.filter(is_active=True)
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin | IsProjectManagerOrTenantAdmin]

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


class GroupedPMAssignmentView(APIView):
    permission_classes = [IsAuthenticated, IsTenantAdmin]

    def get(self, request):
        all_pms = Employee.objects.filter(user__role='project_manager')
        all_devs = set(Employee.objects.filter(user__role='developer'))

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
            subtask_count = Subtask.objects.filter(
                assigned_to=dev,
                task__project__is_active=True
            ).count()

            data.append({
                "id": dev.id,
                "full_name": dev.full_name, 
                "email": dev.user.email,
                "assigned_subtasks_count": subtask_count
            })

        return Response(data)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsProjectReadOnlyOrManager]

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.all() if user.is_tenant_admin() else Task.objects.filter(project__members=user.employee)

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
                task__project__project_members__is_active=True,
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

        if user.role == 'developer':
            task_label_ids = Label.objects.filter(tasks__project__project_members__employee=employee).values_list("id", flat=True)
            subtask_label_ids = Label.objects.filter(subtasks__assigned_to=employee).values_list("id", flat=True)

            label_ids = set(task_label_ids).union(set(subtask_label_ids))
            return Label.objects.filter(id__in=label_ids).distinct()

        return Label.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user.employee)


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


class DeveloperDashboardDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = request.user.employee

        # Get all projects this employee is part of
        project_memberships = ProjectMember.objects.filter(employee=employee, is_active=True)
        project_ids = project_memberships.values_list("project_id", flat=True)

        # Get all subtasks assigned to this employee
        subtasks = Subtask.objects.filter(assigned_to=employee).select_related("task", "task__project")

        # Group subtasks by project and task
        dashboard_data = {}
        for subtask in subtasks:
            project = subtask.task.project
            task = subtask.task

            if project.id not in dashboard_data:
                dashboard_data[project.id] = {
                    "id": project.id,
                    "name": project.name,
                    "is_active": project.is_active,
                    "tasks": {}
                }

            task_entry = dashboard_data[project.id]["tasks"].setdefault(task.id, {
                "id": task.id,
                "name": task.title,
                "subtasks": []
            })

            task_entry["subtasks"].append({
                "id": subtask.id,
                "title": subtask.title,
                "status": subtask.status,
                "due_date": subtask.due_date
            })

        # Convert dict to list
        result = list(dashboard_data.values())
        for project in result:
            project["tasks"] = list(project["tasks"].values())

        return Response(result)


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