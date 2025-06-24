from rest_framework import generics, viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from tenant_apps.employee.serializers import EmployeeSerializer, SetPasswordSerializer
from tenant_apps.employee.models import Employee
from core.permissions import IsTenantAdmin
from shared_apps.custom_auth.models import User
from django.contrib.auth.tokens import default_token_generator
from tenant_apps.employee.utils.email import send_set_password_email
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return Employee.objects.filter(user__tenant=self.request.user.tenant)

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

        send_set_password_email(user)

        return Response({"detail": "Invitation resent."}, status=status.HTTP_200_OK)


class SetPasswordView(APIView):
    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Password set successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)