from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tenant_apps.project_management.models import ProjectMember, Subtask


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