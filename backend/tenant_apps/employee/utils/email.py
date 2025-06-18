from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings

def send_set_password_email(user):
    uid = user.pk  # assuming this is an integer
    token = default_token_generator.make_token(user)

    tenant_domain = user.tenant.domain_url  # e.g., "acme.localhost"
    reset_url = f"http://{tenant_domain}:5173/set-password/{uid}/{token}"

    subject = "Set your password for Teamora"
    message = (
        f"Hello,\n\n"
        f"Your account has been created. To set your password, click the link below:\n\n"
        f"{reset_url}\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"Thanks,\nTeamora"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
