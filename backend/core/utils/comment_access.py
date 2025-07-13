from core.constants import UserRoles

def is_employee_allowed_to_comment(employee, user_role, content_type, object_id):
    if content_type == 'task':
        task = Task.objects.filter(id=object_id).first()
        if not task:
            return False
        return ProjectMember.objects.filter(
            project=task.project, employee=employee, is_active=True
        ).exists()

    elif content_type == 'subtask':
        subtask = Subtask.objects.select_related('task__project').filter(id=object_id).first()
        if not subtask:
            return False

        is_member = ProjectMember.objects.filter(
            project=subtask.task.project, employee=employee, is_active=True
        ).exists()

        if user_role == UserRoles.DEVELOPER:
            return subtask.assigned_to == employee
        return is_member

    return False