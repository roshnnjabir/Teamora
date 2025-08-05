from celery import shared_task
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django_tenants.utils import schema_context
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from shared_apps.tenants.models import Domain
from tenant_apps.employee.models import Employee
from django.template.loader import render_to_string
from premailer import transform
from django.contrib.auth import get_user_model
from core.constants import UserRoles

User = get_user_model()

@shared_task
def send_set_password_email_task(user_id, token):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return  # User was deleted or invalid

    uid = urlsafe_base64_encode(force_bytes(user.pk))

    domain_obj = Domain.objects.filter(tenant=user.tenant).first()
    domain = domain_obj.domain if domain_obj else getattr(settings, "DEFAULT_TENANT_DOMAIN", "localhost")

    reset_url = f"http://{domain}/set-password/{uid}/{token}"

    # Switch to the correct tenant schema to access the Employee model
    with schema_context(user.tenant.schema_name):
        try:
            employee = Employee.objects.get(user=user)
            full_name = employee.full_name
        except Employee.DoesNotExist:
            full_name = "User"

    subject = "Set your password for Teamora"
 
    html_message = render_to_string("emails/set_password_email.html", {
        'full_name': full_name,
        'email': user.email,
        'reset_url': reset_url,
    })
    html_message = transform(html_message)

    plain_message = (
        f"Hello {full_name},\n\n"
        f"An account has been created for you on Teamora using this email: {user.email}\n\n"
        f"To set your password and access your account, click the link below:\n\n"
        f"{reset_url}\n\n"
        f"If you did not expect this invitation, you can safely ignore this email.\n\n"
        f"Thanks,\nThe Teamora Team"
    )

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )

@shared_task
def send_role_change_email(full_name, email, old_role, new_role, tenant_name):
    subject = "Your Role Has Been Updated in Teamora"

    old_label = UserRoles(old_role).label
    new_label = UserRoles(new_role).label

    html_message = render_to_string("emails/project_management/role_changed_email.html", {
        'full_name': full_name,
        'email': email,
        'old_role': old_label,
        'new_role': new_label,
        'tenant_name': tenant_name,
    })

    plain_message = (
        f"Hi {full_name},\n\n"
        f"Your role in {tenant_name} has been updated.\n"
        f"Previous Role: {old_label}\n"
        f"New Role: {new_label}\n\n"
        f"If this was unexpected or incorrect, please contact your organization admin.\n\n"
        f"— Teamora Team"
    )

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=html_message,
        fail_silently=False,
    )