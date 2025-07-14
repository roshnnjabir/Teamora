from rest_framework.exceptions import PermissionDenied

def ensure_project_is_active(project):
    if not project.is_active:
        raise PermissionDenied("This project is inactive. You cannot modify its data.")

def ensure_active_via_task(task):
    ensure_project_is_active(task.project)

def ensure_active_via_subtask(subtask):
    ensure_project_is_active(subtask.task.project)

def ensure_active_via_member(member):
    ensure_project_is_active(member.project)