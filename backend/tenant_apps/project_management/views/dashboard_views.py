"""
Dashboard Views

Serves developer dashboard-related API views like workload summaries or performance insights.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tenant_apps.project_management.models import ProjectMember, Project, Task, Subtask

# Lists all projects he is been part of, past and present, shows subtasks assigned to him under tasks
class DeveloperDashboardDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employee = request.user.employee

        project_memberships = ProjectMember.objects.filter(employee=employee).select_related("project")
        project_ids = project_memberships.values_list("project_id", flat=True)
        projects = Project.objects.filter(id__in=project_ids)

        project_active_map = {
            membership.project_id: membership.is_active
            for membership in project_memberships
        }

        tasks = Task.objects.filter(project__in=projects).select_related("project")
        subtasks = Subtask.objects.filter(task__in=tasks).select_related("task", "task__project")

        subtasks_by_task = {}
        for subtask in subtasks:
            if subtask.assigned_to_id == employee.id:
                subtasks_by_task.setdefault(subtask.task.id, []).append({
                    "id": subtask.id,
                    "title": subtask.title,
                    "status": subtask.status,
                    "due_date": subtask.due_date,
                })

        # Final structure
        dashboard_data = {
            "active_projects": [],
            "past_projects": [],
        }

        for project in projects:
            project_tasks = tasks.filter(project=project)
            filtered_tasks = []

            for task in project_tasks:
                developer_subtasks = subtasks_by_task.get(task.id, [])
                if developer_subtasks:
                    filtered_tasks.append({
                        "id": task.id,
                        "name": task.title,
                        "subtasks": developer_subtasks
                    })

            project_entry = {
                "id": project.id,
                "name": project.name,
                "is_active": project.is_active,  # project itself
                "membership_active": project_active_map.get(project.id, False),  # developer's status
                "tasks": filtered_tasks
            }

            if project_entry["membership_active"]:
                dashboard_data["active_projects"].append(project_entry)
            else:
                dashboard_data["past_projects"].append(project_entry)

        return Response(dashboard_data)