from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.authentication import SessionAuthentication, BasicAuthentication

from shared_apps.tenants.models import Client, Domain
from shared_apps.tenants.tasks.email_tasks import send_otp_email_task
from shared_apps.tenants.serializers import TenantSignupSerializer
from shared_apps.tenants.utils import is_valid_subdomain
from shared_apps.custom_auth.models import User

from django_tenants.utils import schema_context, get_tenant_model, get_tenant_domain_model
from django.core.management import call_command
from django.utils.crypto import get_random_string
from django.core.cache import cache
from django.db import transaction
from django.conf import settings

from core.permissions import IsTenantAdmin
from rest_framework_simplejwt.tokens import RefreshToken


Client = get_tenant_model()
Domain = get_tenant_domain_model()


class TenantSignupView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):        
        email = request.data.get('email', '').strip().lower()
        if not cache.get(f'otp_verified_{email}'):
            return Response({"detail": "OTP not verified."}, status=status.HTTP_400_BAD_REQUEST)

        subdomain = request.data.get('subdomain', '').strip().lower()
        valid, error = is_valid_subdomain(subdomain)
        if not valid:
            return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TenantSignupSerializer(data=request.data)
        if serializer.is_valid():
            tenant = serializer.save()

            # 🛠️ Migrate the tenant schema so it has all tables
            call_command(
                'migrate_schemas',
                schema_name=tenant.schema_name,
                interactive=False,
                verbosity=0
            )

            # Get tenant admin user based on direct tenant relationship
            tenant_admin_user = User.objects.filter(
                tenant=tenant,
                role='tenant_admin'  # or use UserRoles.TENANT_ADMIN if using constants
            ).first()

            if not tenant_admin_user:
                return Response(
                    {"detail": "Tenant admin user not found."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            refresh = RefreshToken.for_user(tenant_admin_user)
            cache.delete(f'otp_verified_{email}')

            return Response({
                'tenant_id': tenant.id,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CheckTenantAvailabilityView(APIView):
    permission_classes = [AllowAny]

    def post(self,  request):
        subdomain_input = request.data.get('subdomain', '').strip().lower()
        tenant_name = request.data.get('tenant_name', '').strip()

        if not tenant_name:
            return Response({'detail': 'Tenant name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        subdomain = subdomain_input.split(".")[0] if subdomain_input else ""

        valid, error = is_valid_subdomain(subdomain)
        if not valid:
            return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

        domain_exist = Domain.objects.filter(domain=subdomain).exists()
        tenant_name_exist = Client.objects.filter(name__iexact=tenant_name).exists()

        return Response({
            'subdomain_available': not domain_exist,
            'tenant_name_available': not tenant_name_exist
        })


class SendOTPView(APIView):
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response(
                {'detail': 'A user with this email already exists. Please sign in instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp = get_random_string(length=6, allowed_chars='0123456789')

        cache_key = f'signup_otp_{email}'
        cache.set(cache_key, otp, timeout=300)  # 5 minutes

        subject = 'Your OTP for Workspace Signup'

        # Send the OTP via Celery (with HTML template support)
        send_otp_email_task.delay(subject, otp, [email])

        return Response({'detail': 'OTP sent successfully.'}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({'detail': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f'signup_otp_{email}'
        cached_otp = cache.get(cache_key)

        if cached_otp is None:
            return Response({'detail': 'OTP expired or not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if str(cached_otp) != str(otp):
            return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        cache.delete(cache_key)
        cache.set(f'otp_verified_{email}', True, timeout=600)

        return Response({'detail': 'OTP verified successfully.'}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def super_admin_dashboard(request):
    data = []
    clients = Client.objects.exclude(schema_name="public")

    for client in clients:
        # get domain name
        domain = Domain.objects.filter(tenant=client).first()
        subdomain = domain.domain if domain else None

        # Switch to tenant schema and count users
        with schema_context(client.schema_name):
            user_count = User.objects.count()

        data.append({
            "id": client.id,
            "name": client.name,
            "schema": client.schema_name,
            "subdomain": subdomain,
            "on_trial": client.on_trial,
            "paid_until": client.paid_until,
            "is_blocked": client.is_blocked,
            "created_on": client.created_on,
            "user_count": user_count,
        })

    return Response(data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def toggle_block_tenant(request, tenant_id):
    try:
        tenant = Client.objects.get(id=tenant_id)

        if tenant.schema_name == "public":
            return Response({"error": "Cannot block the public schema."}, status=400)

        tenant.is_blocked = not tenant.is_blocked
        tenant.save()
        return Response({"status": "success", "is_blocked": tenant.is_blocked})
    except Client.DoesNotExist:
        return Response({"error": "Tenant not found"}, status=404)