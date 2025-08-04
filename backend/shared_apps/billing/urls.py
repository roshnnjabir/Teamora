from django.urls import path
from .views import payment_info, create_checkout_session, stripe_webhook, audit_log_list

urlpatterns = [
    path("payment-info/", payment_info),
    path("stripe/create-checkout-session/", create_checkout_session),
    path("stripe/webhook/", stripe_webhook),
    path("audit-log/", audit_log_list, name="audit_log_list"),
]