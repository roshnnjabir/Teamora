from tenant_apps.project_management.models import DeveloperAssignmentAuditLog

def log_pm_assignment_change(developer_id, previous_manager_id=None, new_manager_id=None, assigned_by=None):
    if previous_manager_id == new_manager_id:
        return

    DeveloperAssignmentAuditLog.objects.create(
        developer_id=developer_id,
        previous_manager_id=previous_manager_id,
        new_manager_id=new_manager_id,
        assigned_by=assigned_by
    )