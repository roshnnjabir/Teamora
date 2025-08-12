from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django_tenants.utils import schema_context
from shared_apps.tenants.models import Domain
from tenant_apps.employee.models import Employee
from django.template.loader import render_to_string
from premailer import transform


@shared_task
def send_pm_blocking_subtasks_email(schema_name, pm_id, developer_name, project_names):
    with schema_context(schema_name):
        try:
            pm = Employee.objects.select_related("user").get(id=pm_id)
        except Employee.DoesNotExist:
            return

        domain_obj = Domain.objects.filter(tenant=pm.user.tenant).first()
        tenant_name = getattr(pm.user.tenant, 'name', 'Your Organization')
        domain = domain_obj.domain if domain_obj else getattr(settings, "DEFAULT_TENANT_DOMAIN", "localhost")

        subject = "Action Required: Unassignment Blocked by Active Subtasks"

        html_message = render_to_string("emails/project_management/pm_blocking_subtasks_email.html", {
            'pm_name': pm.full_name,
            'developer_name': developer_name,
            'project_names': project_names,
            'tenant_name': tenant_name,
        })
        html_message = transform(html_message)

        plain_message = (
            f"Hello {pm.full_name},\n\n"
            f"The Tenant Admin attempted to unassign developer {developer_name}, but they have active subtasks "
            f"in the following project(s) assigned to you in {tenant_name}:\n\n"
            f"{', '.join(project_names)}\n\n"
            f"Please reassign, unassign, or complete those subtasks so the unassignment can proceed.\n\n"
            f"Thank you,\nProject Management System"
        )

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[pm.user.email],
            html_message=html_message,
            fail_silently=False,
        )