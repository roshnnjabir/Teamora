# core/services.py

from erp_modules.project_management.models import Task

def assign_task(task_id, user):
    task = Task.objects.get(id=task_id)
    task.assigned_to = user
    task.save()
    return task