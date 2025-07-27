from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from datetime import date, timedelta
import stripe
from shared_apps.tenants.models import Client
from django.conf import settings

from shared_apps.billing.models import PaymentAudit
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

stripe.api_key = settings.STRIPE_SECRET_KEY

import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_info(request):
    tenant = request.user.tenant
    return Response({
        "tenant_name": tenant.name,
        "trial": tenant.on_trial,
        "paid_until": tenant.paid_until,
        "plans": [
            {"id": "basic", "name": "Basic (100 users)", "price": 1000},
            {"id": "pro", "name": "Pro (500 users)", "price": 4000},
            {"id": "enterprise", "name": "Enterprise (1000 users)", "price": 7000},
        ]
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    tenant = request.user.tenant

    # One-time yearly fee (e.g., $100.00)
    amount = 10000  # in cents, i.e., $100.00

    host = request.get_host()
    protocol = "http" if settings.DEBUG else "https"
    base_url = f"{protocol}://{host.replace(':8000', ':5173')}"

    success_url = base_url + "/payment-success"
    cancel_url = base_url + "/payment-cancel"

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "unit_amount": amount,
                "product_data": {
                    "name": "Annual Subscription (1 Year Access)",
                    "metadata": {
                        "tenant_name": tenant.name,
                        "subdomain": request.get_host()
                    }
                }
            },
            "quantity": 1
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
            "subdomain": request.get_host()
        }
    )

    return Response({"checkout_url": session.url})


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    logger.info("🔔 Stripe webhook triggered")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        logger.info(f"✅ Verified event type: {event['type']}")
    except Exception as e:
        logger.error(f"❌ Webhook verification failed: {e}")
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})

        tenant_id = metadata.get("tenant_id")
        if not tenant_id:
            logger.error("❌ Missing tenant_id in session metadata.")
            return HttpResponse(status=400)

        try:
            tenant = Client.objects.get(id=tenant_id)
        except Client.DoesNotExist:
            logger.error(f"❌ Tenant with ID {tenant_id} does not exist.")
            return HttpResponse(status=404)

        try:
            # Update tenant payment status
            tenant.on_trial = False
            tenant.paid_until = date.today() + timedelta(days=365)
            tenant.save()

            logger.info(f"✅ Tenant '{tenant.name}' updated: paid_until = {tenant.paid_until}")

            # Record audit
            PaymentAudit.objects.create(
                tenant_id=tenant.id,
                tenant_name=tenant.name,
                stripe_session_id=session["id"],
                amount=session["amount_total"] / 100,
                currency=session["currency"],
                paid_until=tenant.paid_until,
                payment_status=session.get("payment_status", "paid"),
            )

            logger.info(f"🧾 Payment audit recorded for tenant '{tenant.name}'.")

        except Exception as e:
            logger.error(f"❌ Failed to update tenant or log audit: {e}")
            return HttpResponse(status=500)

    return HttpResponse(status=200)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def audit_log_list(request):
    audits = PaymentAudit.objects.all().order_by("-created_at")

    # Optional: Add pagination
    paginator = PageNumberPagination()
    paginator.page_size = 20  # Adjust as needed
    result_page = paginator.paginate_queryset(audits, request)

    data = [
        {
            "tenant_id": audit.tenant_id,
            "tenant_name": audit.tenant_name,
            "stripe_session_id": audit.stripe_session_id,
            "amount": float(audit.amount),
            "currency": audit.currency,
            "paid_until": audit.paid_until,
            "payment_status": audit.payment_status,
            "created_at": audit.created_at,
        }
        for audit in result_page
    ]
    
    return paginator.get_paginated_response(data)