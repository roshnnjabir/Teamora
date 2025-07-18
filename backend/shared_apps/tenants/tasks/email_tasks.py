from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from premailer import transform


@shared_task
def send_otp_email_task(subject, otp_code, recipient_list):
    html_message = render_to_string('emails/otp_email.html', {
        'otp_code': otp_code
    })
    html_message = transform(html_message)

    text_message = f"Your One-Time Password (OTP) is: {otp_code}"

    send_mail(
        subject=subject,
        message=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )


@shared_task
def send_tenant_created_email_task(to_email, tenant_domain):
    subject = "🎉 Your Teamora Tenant is Ready!"
    login_url = f"http://{tenant_domain}:5173/login"

    html_message = render_to_string('emails/tenant_created.html', {
        'tenant_domain': tenant_domain,
        'login_url': login_url,
    })
    html_message = transform(html_message)

    text_message = f"""
        🎉 Your Teamora Tenant is Ready!
        
        Hello there!
        
        Your tenant is ready at: {tenant_domain}
        Login: {login_url}
        """

    send_mail(
        subject=subject,
        message=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to_email],
        html_message=html_message,
        fail_silently=False,
    )