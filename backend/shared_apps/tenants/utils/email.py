from django.core.mail import send_mail
from django.conf import settings

def send_tenant_created_email(to_email, tenant_domain):
    subject = "Your Tenant Has Been Created"
    login_url = f"http://{tenant_domain}:5173/login"
    message = (
        f"Hello,\n\n"
        f"Your tenant has been created successfully.\n"
        f"Login here: {login_url}\n\n"
        f"Thanks,\nThe Team"
    )
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [to_email],
    )
