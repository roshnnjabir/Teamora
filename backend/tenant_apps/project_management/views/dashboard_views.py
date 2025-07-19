"""
Dashboard Views

Serves developer dashboard-related API views like workload summaries or performance insights.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tenant_apps.project_management.models import ProjectMember, Project, Task, Subtask


class DeveloperDashboardDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = request.user.employee

        # Include all projects the employee is part of, regardless of status or subtask assignment
        project_memberships = ProjectMember.objects.filter(employee=employee)
        projects = Project.objects.filter(id__in=project_memberships.values_list("project_id", flat=True))

        # Preload tasks and subtasks to reduce DB hits
        tasks = Task.objects.filter(project__in=projects).select_related("project")
        subtasks = Subtask.objects.filter(task__in=tasks).select_related("task", "task__project")

        # Build a mapping of subtasks assigned to this employee
        subtasks_by_task = {}
        for subtask in subtasks:
            if subtask.task.id not in subtasks_by_task:
                subtasks_by_task[subtask.task.id] = []
            if subtask.assigned_to_id == employee.id:
                subtasks_by_task[subtask.task.id].append({
                    "id": subtask.id,
                    "title": subtask.title,
                    "status": subtask.status,
                    "due_date": subtask.due_date,
                })

        # Construct dashboard data
        dashboard_data = []
        for project in projects:
            project_tasks = tasks.filter(project=project)
            project_task_entries = []

            for task in project_tasks:
                task_entry = {
                    "id": task.id,
                    "name": task.title,
                    "subtasks": subtasks_by_task.get(task.id, [])
                }
                project_task_entries.append(task_entry)

            dashboard_data.append({
                "id": project.id,
                "name": project.name,
                "is_active": project.is_active,
                "tasks": project_task_entries
            })

        return Response(dashboard_data)