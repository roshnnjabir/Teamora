from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from rest_framework import generics
from shared_apps.tenants.tasks.email_tasks import send_otp_email_task
from django_tenants.utils import schema_context
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from shared_apps.custom_auth.models import User
from django.utils.crypto import get_random_string
from shared_apps.tenants.serializers import TenantSignupSerializer
from shared_apps.tenants.models import Client, Domain
from django.core.management import call_command
from shared_apps.custom_auth.models import User
from core.permissions import IsTenantAdmin
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.conf import settings


class TenantSignupView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
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

            return Response({
                'tenant_id': tenant.id,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

        return Response({'detail': 'OTP verified successfully.'}, status=status.HTTP_200_OK)