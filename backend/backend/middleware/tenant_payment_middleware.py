import datetime
import logging
from django.utils.deprecation import MiddlewareMixin
from django_tenants.utils import get_tenant
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger(__name__)

TRIAL_DAYS = getattr(settings, "TRIAL_PERIOD_DAYS", 30)

WHITELIST_PATHS = [
    "/api/token/",
    "/api/token/refresh/",
    "/api/payment-info/",
    "/api/stripe/create-checkout-session/",
    "/api/stripe/webhook/",
    "/api/me/",
]

class TenantPaymentMiddleware(MiddlewareMixin):
    def process_request(self, request):
        tenant = get_tenant(request)

        if tenant.schema_name == "public":
            return

        if any(request.path.startswith(path) for path in WHITELIST_PATHS):
            return

        today = datetime.date.today()
        created_on = tenant.created_on or today

        if tenant.on_trial:
            trial_end = created_on + datetime.timedelta(days=TRIAL_DAYS)
            if trial_end < today:
                logger.info(f"Tenant '{tenant.schema_name}' blocked: trial expired on {trial_end}.")
                return self._deny_access("Trial period has expired.")
        else:
            if not tenant.paid_until or tenant.paid_until < today:
                logger.info(f"Tenant '{tenant.schema_name}' blocked: payment expired on {tenant.paid_until}.")
                return self._deny_access("Your subscription payment is overdue.")

        return

    def _deny_access(self, message):
        return JsonResponse({
            "detail": message,
            "code": "payment_required"
        }, status=403)