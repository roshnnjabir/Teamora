# core/services.py

from erp_modules.project_management.models import Subtask

def assign_task(task_id, user):
    subtask = Task.objects.get(id=task_id)
    subtask.assigned_to = user
    subtask.save()
    return task