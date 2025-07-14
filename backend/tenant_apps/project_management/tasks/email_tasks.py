from celery import shared_task
from django.core.mail import send_mail
from tenant_apps.employee.models import Employee

@shared_task
def send_pm_blocking_subtasks_email(pm_id, developer_name, project_names):
    try:
        pm = Employee.objects.get(id=pm_id)
        subject = f"Action Required: Unassignment Blocked by Active Subtasks"
        body = (
            f"Hello {pm.full_name},\n\n"
            f"The Tenant Admin attempted to unassign developer {developer_name}, but they have active subtasks "
            f"in the following project(s) assigned to you:\n\n"
            f"{', '.join(project_names)}\n\n"
            f"Please reassign, unassign, or complete those subtasks so the unassignment can proceed.\n\n"
            f"Thank you,\nProject Management System"
        )
        send_mail(
            subject,
            body,
            "no-reply@yourdomain.com",  # Change this to your system's from email
            [pm.user.email],  # Assumes PM has a user and email
            fail_silently=False,
        )
    except Employee.DoesNotExist:
        # Optionally log or handle this
        pass