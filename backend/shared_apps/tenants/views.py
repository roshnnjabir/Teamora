from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from django_tenants.utils import schema_context
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from shared_apps.custom_auth.models import User
from shared_apps.tenants.serializers import TenantSignupSerializer, TenantUserCreateSerializer
from shared_apps.tenants.models import Client, Domain
from core.permissions import IsTenantAdmin
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction

class TenantSignupView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = TenantSignupSerializer(data=request.data)
        if serializer.is_valid():
            tenant = serializer.save()

            # Get tenant admin user based on direct tenant relationship
            tenant_admin_user = User.objects.filter(
                tenant=tenant,
                role='TENANT_ADMIN'  # or use UserRoles.TENANT_ADMIN if using constants
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


class TenantUserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = TenantUserCreateSerializer
    permission_classes = [IsTenantAdmin]