from celery import shared_task
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from shared_apps.tenants.models import Domain
from tenant_apps.employee.models import Employee
from django.contrib.auth import get_user_model

User = get_user_model()

@shared_task
def send_set_password_email_task(user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return  # User was deleted or invalid

    uid = user.pk
    token = default_token_generator.make_token(user)

    domain_obj = Domain.objects.filter(tenant=user.tenant).first()
    domain = domain_obj.domain if domain_obj else getattr(settings, "DEFAULT_TENANT_DOMAIN", "localhost")

    reset_url = f"http://{domain}:5173/set-password/{uid}/{token}"

    # Fetch employee to get full_name
    try:
        employee = Employee.objects.get(user=user)
        full_name = employee.full_name
    except Employee.DoesNotExist:
        full_name = "User"

    subject = "Set your password for Teamora"
    message = (
        f"Hello {full_name},\n\n"
        f"An account has been created for you on Teamora using this email: {user.email}\n\n"
        f"To set your password and access your account, click the link below:\n\n"
        f"{reset_url}\n\n"
        f"If you did not expect this invitation, you can safely ignore this email.\n\n"
        f"Thanks,\nThe Teamora Team"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )