from rest_framework import generics, viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from tenant_apps.employee.serializers import EmployeeSerializer, SetPasswordSerializer, UserProfileSerializer
from tenant_apps.employee.models import Employee
from core.permissions import IsTenantAdmin
from core.constants import UserRoles
from shared_apps.custom_auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from tenant_apps.employee.tasks.email_tasks import send_set_password_email_task
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return Employee.objects.filter(user__tenant=self.request.user.tenant).exclude(user__role=UserRoles.TENANT_ADMIN)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    def perform_destroy(self, instance):
        # Also delete the associated user
        user = instance.user
        instance.delete()
        user.delete()

    @action(detail=True, methods=['post'], url_path='resend-invitation')
    def resend_invitation(self, request, id=None):
        employee = self.get_object()
        user = employee.user

        if user.has_usable_password():
            return Response(
                {"detail": "User already has a password set."},
                status=status.HTTP_400_BAD_REQUEST
            )


        user.set_unusable_password()
        user.save()

        token = default_token_generator.make_token(user)
        send_set_password_email_task.delay(user.pk, token)

        return Response({"detail": "Invitation resent."}, status=status.HTTP_200_OK)


class ValidateSetPasswordTokenView(APIView):
    def post(self, request):
        uidb64 = request.data.get("uidb64")
        token = request.data.get("token")

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid user."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Valid token."}, status=status.HTTP_200_OK)


class SetPasswordView(APIView):
    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Password set successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)