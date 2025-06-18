from rest_framework import generics, viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from tenant_apps.employee.serializers import EmployeeSerializer, SetPasswordSerializer
from tenant_apps.employee.models import Employee
from core.permissions import IsTenantAdmin
from shared_apps.custom_auth.models import User
from django.contrib.auth.tokens import default_token_generator
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


class SetPasswordView(APIView):
    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Password set successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)